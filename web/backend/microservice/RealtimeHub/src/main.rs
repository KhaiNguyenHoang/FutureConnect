
mod db;
mod ws;

use axum::{
    routing::get,
    Router,
};
use std::net::SocketAddr;
use std::sync::Arc;
use dashmap::{DashMap, DashSet};
use dotenv::dotenv;
use crate::ws::AppState;

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
        .with_state(state);

    // Address
    let addr = SocketAddr::from(([0, 0, 0, 0], 3004));
    println!("Realtime Hub listening on {}", addr);

    // Start server
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
