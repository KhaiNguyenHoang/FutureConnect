
use mongodb::{Client, options::ClientOptions, Database};
use std::env;
use std::error::Error;

pub async fn connect_db() -> Result<Database, Box<dyn Error>> {
    let mongo_url = env::var("MONGODB_URL").expect("MONGODB_URL must be set");
    let client_options = ClientOptions::parse(mongo_url).await?;
    let client = Client::with_options(client_options)?;
    
    // Check connection
    println!("Connected to MongoDB");
    
    // Return database instance (using "realtime_hub" or derived from URL)
    Ok(client.database("realtime_hub"))
}
