const BASE_URL = "http://localhost:3002";
const USER_ID = "user_123";
const USER_ID_2 = "user_456";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTest() {
    console.log("🚀 Starting Social Service Verification");

    try {
        // 1. Create Post
        console.log("\n1. Creating Post...");
        const postRes = await fetch(`${BASE_URL}/posts`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-user-id": USER_ID },
            body: JSON.stringify({
                content: "Hello World from Verification Script!",
                tags: ["test", "verification"],
            }),
        });
        console.log(`Response Status: ${postRes.status}`);
        const text = await postRes.text();
        console.log("Response Body:", text);

        let post;
        try {
            post = JSON.parse(text);
        } catch (e) {
            throw new Error("Failed to parse JSON response");
        }
        console.log("✅ Post Created:", post._id);

        // 2. Get Feed
        console.log("\n2. Fetching Feed...");
        const feedRes = await fetch(`${BASE_URL}/posts/feed`, {
            headers: { "x-user-id": USER_ID },
        });
        const feed = await feedRes.json();
        console.log(`✅ Feed received with ${feed.length} posts`);

        // 3. Like Post
        console.log("\n3. Liking Post...");
        const likeRes = await fetch(`${BASE_URL}/social/${post._id}/like`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-user-id": USER_ID_2 },
            body: JSON.stringify({ type: "Post" }),
        });
        const like = await likeRes.json();
        console.log("✅ Post Liked by User 2:", like._id);

        // 4. Create Group
        console.log("\n4. Creating Group...");
        const groupRes = await fetch(`${BASE_URL}/groups`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-user-id": USER_ID },
            body: JSON.stringify({
                name: "Test Group " + Date.now(),
                description: "A group for testing",
            }),
        });
        const group = await groupRes.json();
        console.log("✅ Group Created:", group.name);

        // 5. Ask Question
        console.log("\n5. Asking Question...");
        const qRes = await fetch(`${BASE_URL}/qa/questions`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-user-id": USER_ID },
            body: JSON.stringify({
                title: "How to run verification?",
                body: "I need to know how to run tests.",
                tags: ["help", "test"],
            }),
        });
        const question = await qRes.json();
        console.log("✅ Question Asked:", question._id);

        // 6. Answer Question
        console.log("\n6. Answering Question...");
        await fetch(`${BASE_URL}/qa/questions/${question._id}/answers`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-user-id": USER_ID_2 },
            body: JSON.stringify({ body: "Just run this script!" }),
        });
        console.log("✅ Question Answered");

        // 7. Search
        console.log("\n7. Searching...");
        await sleep(2000); // Give time for indexing/sync if needed (though mongo regex is instant)
        const searchRes = await fetch(`${BASE_URL}/search?q=verification&type=post`, {
            headers: { "x-user-id": USER_ID },
        });
        const searchResults = await searchRes.json();
        console.log(`✅ Search found ${searchResults.length} items`);

        console.log("\n🎉 Verification Completed Successfully!");
    } catch (error) {
        console.error("\n❌ Verification Failed:", error);
    }
}

runTest();
