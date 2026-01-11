
use axum::{
    extract::{ws::{Message, WebSocket, WebSocketUpgrade}, State, Query},
    response::Response,
    http::StatusCode,
};
use futures::{sink::SinkExt, stream::StreamExt};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use dashmap::{DashMap, DashSet};
use tokio::sync::mpsc;

use mongodb::Database;
use mongodb::bson::doc;
use jsonwebtoken::{decode, DecodingKey, Validation, Algorithm};

// UserId -> Sender
pub type ConnectionState = Arc<DashMap<String, mpsc::UnboundedSender<Message>>>;
// GroupId -> Set of UserIds
pub type GroupState = Arc<DashMap<String, DashSet<String>>>;

#[derive(Clone)]
pub struct AppState {
    pub connections: ConnectionState,
    pub groups: GroupState,
    pub db: Database,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub userId: String,
    pub email: String,
    pub exp: usize,
}

#[derive(Deserialize)]
pub struct AuthParams {
    pub token: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum ClientMessage {
    #[serde(rename = "join")]
    Join { user_id: String },
    
    #[serde(rename = "join_group")]
    JoinGroup { user_id: String, group_id: String },

    #[serde(rename = "leave_group")]
    LeaveGroup { user_id: String, group_id: String },

    #[serde(rename = "chat")]
    Chat {
        target_id: String, // UserId or GroupId
        is_group: bool, 
        content: Option<String>,
        attachments: Option<Vec<String>>,
        kind: String, 
    },

    #[serde(rename = "signal")]
    Signal {
        target_id: String,
        payload: serde_json::Value,
    }
}

pub async fn ws_handler(
    ws: WebSocketUpgrade,
    Query(params): Query<AuthParams>,
    State(state): State<AppState>,
) -> Result<Response, StatusCode> {
    let secret = std::env::var("JWT_SECRET").expect("JWT_SECRET must be set");
    let token_data = decode::<Claims>(
        &params.token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &Validation::new(Algorithm::HS256),
    ).map_err(|_| StatusCode::UNAUTHORIZED)?;

    let user_id = token_data.claims.userId;
    Ok(ws.on_upgrade(move |socket| handle_socket(socket, state, user_id)))
}

async fn handle_socket(socket: WebSocket, state: AppState, user_id: String) {
    let (mut sender, mut receiver) = socket.split();
    let (tx, mut rx) = mpsc::unbounded_channel();

    // Register user immediately
    state.connections.insert(user_id.clone(), tx.clone());
    println!("User {} connected (Authenticated)", user_id);

    let mut send_task = tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            if sender.send(msg).await.is_err() {
                break;
            }
        }
    });

    let my_user_id = user_id.clone();
    let mut my_groups: Vec<String> = Vec::new();

    while let Some(msg) = receiver.next().await {
        if let Ok(Message::Text(text)) = msg {
            if let Ok(client_msg) = serde_json::from_str::<ClientMessage>(&text) {
                match client_msg {
                    ClientMessage::Join { user_id: _ } => {
                        // Already joined/authenticated. 
                        // We ignore the user_id payload here to prevent spoofing, 
                        // or we could error if it doesn't match `my_user_id`.
                        // For now, no-op or just log.
                        // println!("Received join message for already auth user {}", my_user_id);
                    }
                    ClientMessage::JoinGroup { user_id, group_id } => {
                       // Enforce user_id matches authenticated id?
                       if user_id == my_user_id {
                           state.groups.entry(group_id.clone())
                                .or_insert_with(DashSet::new)
                                .insert(user_id.clone());
                           my_groups.push(group_id.clone());
                           println!("User {} joined group {}", user_id, group_id);
                       }
                    }
                    ClientMessage::LeaveGroup { user_id, group_id } => {
                         if user_id == my_user_id {
                             if let Some(members) = state.groups.get(&group_id) {
                                 members.remove(&user_id);
                             }
                         }
                    }
                    ClientMessage::Chat { target_id, is_group, content, attachments, kind } => {
                        let timestamp = std::time::SystemTime::now()
                            .duration_since(std::time::UNIX_EPOCH).unwrap().as_millis() as i64;
                        
                        let response = serde_json::json!({
                            "type": "chat",
                            "sender_id": my_user_id,
                            "target_id": target_id,
                            "is_group": is_group,
                            "content": content,
                            "attachments": attachments,
                            "kind": kind,
                            "timestamp": timestamp
                        });
                        let msg_str = serde_json::to_string(&response).unwrap();

                        // SAVE TO DB
                        let collection = state.db.collection::<mongodb::bson::Document>("messages");
                        let doc = doc! {
                            "sender_id": &my_user_id,
                            "target_id": &target_id,
                            "is_group": is_group,
                            "content": &content,
                            "attachments": &attachments,
                            "kind": &kind,
                            "timestamp": timestamp 
                        };
                        let _ = collection.insert_one(doc, None).await;

                        if is_group {
                            // Broadcast to group members
                            if let Some(members) = state.groups.get(&target_id) {
                                for member_id in members.iter() {
                                    if let Some(conn) = state.connections.get(member_id.key()) {
                                        let _ = conn.send(Message::Text(msg_str.clone()));
                                    }
                                }
                            }
                        } else {
                            // 1-on-1
                            if let Some(target_tx) = state.connections.get(&target_id) {
                                let _ = target_tx.send(Message::Text(msg_str.clone()));
                            }
                            // Echo to sender
                            if let Some(my_tx) = state.connections.get(&my_user_id) {
                                let _ = my_tx.send(Message::Text(msg_str));
                            }
                        }
                    }
                    ClientMessage::Signal { target_id, payload } => {
                        let signal_msg = serde_json::json!({
                            "type": "signal",
                            "sender_id": my_user_id,
                            "payload": payload
                        });
                        let msg_str = serde_json::to_string(&signal_msg).unwrap();
                        
                        // CALL HISTORY: If payload indicates call end
                        if let Some(type_str) = payload.get("type").and_then(|v| v.as_str()) {
                            if type_str == "bye" || type_str == "end-call" || type_str == "reject" {
                                let timestamp = std::time::SystemTime::now()
                                .duration_since(std::time::UNIX_EPOCH).unwrap().as_millis() as i64;
                                
                                let calls_coll = state.db.collection::<mongodb::bson::Document>("calls");
                                let payload_bson = mongodb::bson::to_bson(&payload).unwrap_or(mongodb::bson::Bson::Null);

                                let doc = doc! {
                                    "caller_id": &my_user_id,
                                    "callee_id": &target_id,
                                    "status": type_str,
                                    "timestamp": timestamp,
                                    "payload": payload_bson
                                };
                                let _ = calls_coll.insert_one(doc, None).await;
                            }
                        }

                        if let Some(target_tx) = state.connections.get(&target_id) {
                            let _ = target_tx.send(Message::Text(msg_str));
                        }
                    }
                }
            }
        } else {
            break;
        }
    }

    state.connections.remove(&my_user_id);
    for gid in my_groups {
            if let Some(members) = state.groups.get(&gid) {
                members.remove(&my_user_id);
            }
    }
    
    send_task.abort();
}
