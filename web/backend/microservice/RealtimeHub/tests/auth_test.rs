use axum::{
    routing::get,
    Router,
};
use std::sync::Arc;
use tokio::net::TcpListener;
use dashmap::DashMap;
use realtime_hub::{db, ws};
use realtime_hub::ws::AppState;
use serde::{Deserialize, Serialize};
use jsonwebtoken::{encode, EncodingKey, Header};
use tokio_tungstenite::{connect_async, tungstenite::protocol::Message};
use futures::StreamExt;
use url::Url;

#[derive(Debug, Serialize, Deserialize)]
struct Claims {
    userId: String,
    email: String,
    exp: usize,
}

#[tokio::test]
async fn test_websocket_auth() {
    // 1. Setup Environment
    std::env::set_var("JWT_SECRET", "Secret");
    // Ensure we don't break logic if MONGODB_URL is missing, although connect_db expects it.
    // Assuming local mongo is running.
    if std::env::var("MONGODB_URL").is_err() {
        std::env::set_var("MONGODB_URL", "mongodb://localhost:27017/realtime_hub_test");
    }

    // 2. Setup Server
    let db_handle = db::connect_db().await.expect("Failed to connect to DB");
    let state = AppState {
        connections: Arc::new(DashMap::new()),
        groups: Arc::new(DashMap::new()),
        db: db_handle,
    };

    let app = Router::new()
        .route("/ws", get(ws::ws_handler))
        .with_state(state);

    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let addr = listener.local_addr().unwrap();
    println!("Test server listening on {}", addr);

    tokio::spawn(async move {
        axum::serve(listener, app).await.unwrap();
    });

    // 3. Generate Valid Token
    let claims = Claims {
        userId: "test-user-1".to_string(),
        email: "test@example.com".to_string(),
        exp: 20000000000, // far future
    };
    let token = encode(&Header::default(), &claims, &EncodingKey::from_secret(b"Secret")).unwrap();

    // 4. Connect with Token
    let url = Url::parse(&format!("ws://{}/ws?token={}", addr, token)).unwrap();
    let (mut ws_stream, _) = connect_async(url).await.expect("Failed to connect to WS with valid token");

    println!("Connected successfully with valid token");
    
    // Close cleanly
    ws_stream.close(None).await.unwrap();

    // 5. Connect with Invalid Token (Should fail)
    let bad_url = Url::parse(&format!("ws://{}/ws?token=invalid_token", addr)).unwrap();
    // tokio-tungstenite returns error on handshake failure (401)
    let result = connect_async(bad_url).await;
    match result {
        Ok(_) => panic!("Should have failed with invalid token"),
        Err(e) => println!("Correctly failed with invalid token: {:?}", e),
    }
}
