
use axum::{
    extract::{ws::{Message, WebSocket, WebSocketUpgrade}, State},
    response::Response,
};
use futures::{sink::SinkExt, stream::StreamExt};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use dashmap::{DashMap, DashSet};
use tokio::sync::mpsc;

use mongodb::Database;
use mongodb::bson::doc;

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
    State(state): State<AppState>,
) -> Response {
    ws.on_upgrade(|socket| handle_socket(socket, state))
}

async fn handle_socket(socket: WebSocket, state: AppState) {
    let (mut sender, mut receiver) = socket.split();
    let (tx, mut rx) = mpsc::unbounded_channel();

    let mut send_task = tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            if sender.send(msg).await.is_err() {
                break;
            }
        }
    });

    let mut my_user_id: Option<String> = None;
    let mut my_groups: Vec<String> = Vec::new();

    while let Some(msg) = receiver.next().await {
        if let Ok(Message::Text(text)) = msg {
            if let Ok(client_msg) = serde_json::from_str::<ClientMessage>(&text) {
                match client_msg {
                    ClientMessage::Join { user_id } => {
                        my_user_id = Some(user_id.clone());
                        state.connections.insert(user_id.clone(), tx.clone());
                        println!("User {} connected", user_id);
                    }
                    ClientMessage::JoinGroup { user_id, group_id } => {
                       state.groups.entry(group_id.clone())
                            .or_insert_with(DashSet::new)
                            .insert(user_id.clone());
                       my_groups.push(group_id.clone());
                       println!("User {} joined group {}", user_id, group_id);
                    }
                    ClientMessage::LeaveGroup { user_id, group_id } => {
                         if let Some(members) = state.groups.get(&group_id) {
                             members.remove(&user_id);
                         }
                    }
                    ClientMessage::Chat { target_id, is_group, content, attachments, kind } => {
                        if let Some(uid) = &my_user_id {
                            let timestamp = std::time::SystemTime::now()
                                .duration_since(std::time::UNIX_EPOCH).unwrap().as_millis() as i64;
                            
                            let response = serde_json::json!({
                                "type": "chat",
                                "sender_id": uid,
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
                                "sender_id": uid,
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
                                        // Don't echo to sender here if we want to avoid dupe, but usually fine
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
                                if let Some(my_tx) = state.connections.get(uid) {
                                    let _ = my_tx.send(Message::Text(msg_str));
                                }
                            }
                        }
                    }
                    ClientMessage::Signal { target_id, payload } => {
                         if let Some(uid) = &my_user_id {
                             let signal_msg = serde_json::json!({
                                 "type": "signal",
                                 "sender_id": uid,
                                 "payload": payload
                             });
                             let msg_str = serde_json::to_string(&signal_msg).unwrap();
                             
                             if let Some(target_tx) = state.connections.get(&target_id) {
                                 let _ = target_tx.send(Message::Text(msg_str));
                             }
                         }
                    }
                }
            }
        } else {
            break;
        }
    }

    if let Some(uid) = my_user_id {
        state.connections.remove(&uid);
        for gid in my_groups {
             if let Some(members) = state.groups.get(&gid) {
                 members.remove(&uid);
             }
        }
    }
    send_task.abort();
}
