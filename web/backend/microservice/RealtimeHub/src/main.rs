use realtime_hub::{db, ws};
use realtime_hub::ws::AppState;

use axum::{
    extract::{Query, State},
    response::Json,
    routing::get,
    Router,
};
use serde::{Deserialize, Serialize};
use futures::stream::TryStreamExt;
use mongodb::bson::doc;
use std::net::SocketAddr;
use std::sync::Arc;
use dashmap::{DashMap, DashSet};
use dotenv::dotenv;

#[derive(Deserialize)]
struct HistoryQuery {
    user_id: String,
    target_id: Option<String>,
    group_id: Option<String>,
    limit: Option<i64>,
}

async fn get_messages(
    State(state): State<AppState>,
    Query(params): Query<HistoryQuery>,
) -> Json<Vec<serde_json::Value>> {
    let collection = state.db.collection::<serde_json::Value>("messages");
    let limit = params.limit.unwrap_or(50);
    
    let filter = if let Some(group_id) = params.group_id {
        doc! { "is_group": true, "target_id": group_id }
    } else if let Some(target_id) = params.target_id {
        // P2P: (sender=Me AND target=Other) OR (sender=Other AND target=Me)
        doc! {
            "$or": [
                { "sender_id": &params.user_id, "target_id": &target_id },
                { "sender_id": &target_id, "target_id": &params.user_id }
            ]
        }
    } else {
        doc! {}
    };

    let find_options = mongodb::options::FindOptions::builder()
        .sort(doc! { "timestamp": -1 })
        .limit(limit)
        .build();

    let mut cursor = collection.find(filter, find_options).await.unwrap();
    let mut messages = Vec::new();
    while let Ok(Some(doc)) = cursor.try_next().await {
        messages.push(doc);
    }
    // Reverse to chronological order for chat UI
    messages.reverse();
    Json(messages)
}

async fn get_calls(
    State(state): State<AppState>,
    Query(params): Query<HistoryQuery>,
) -> Json<Vec<serde_json::Value>> {
    let collection = state.db.collection::<serde_json::Value>("calls");
    let limit = params.limit.unwrap_or(20);
    
    // Calls where I am caller OR callee
    let filter = doc! {
        "$or": [
            { "caller_id": &params.user_id },
            { "callee_id": &params.user_id }
        ]
    };

    let find_options = mongodb::options::FindOptions::builder()
        .sort(doc! { "timestamp": -1 })
        .limit(limit)
        .build();

    let mut cursor = collection.find(filter, find_options).await.unwrap();
    let mut calls = Vec::new();
    while let Ok(Some(doc)) = cursor.try_next().await {
        calls.push(doc);
    }
    Json(calls)
}

#[tokio::main]
async fn main() {
    dotenv().ok();

    // Initialize Database
    let db_handle = match db::connect_db().await {
        Ok(db) => db,
        Err(e) => {
            eprintln!("Failed to connect to MongoDB: {}", e);
            return;
        }
    };

    // Initialize State
    let state = AppState {
        connections: Arc::new(DashMap::new()),
        groups: Arc::new(DashMap::new()),
        db: db_handle,
    };

    // Setup routes
    let app = Router::new()
        .route("/", get(|| async { "Realtime Hub is running!" }))
        .route("/ws", get(ws::ws_handler))
        .route("/messages", get(get_messages))
        .route("/calls", get(get_calls))
        .with_state(state);

    // Address
    let addr = SocketAddr::from(([0, 0, 0, 0], 3004));
    println!("Realtime Hub listening on {}", addr);

    // Start server
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
