import { startConsumer } from "../config/rabbitmq";
import { User } from "../models/user.schema";

export const startDbSyncWorker = async () => {
    console.log("Starting DB Sync Worker...");

    await startConsumer("user_updates", async (data: any) => {
        try {
            if (data.event === "USER_DB_UPDATE") {
                const { userId, updateData } = data.data;
                console.log(`Worker: Updating DB for user ${userId}`);

                await User.findByIdAndUpdate(
                    userId,
                    { $set: updateData },
                    { new: true, runValidators: true }
                );

                console.log(`Worker: DB updated for user ${userId}`);
            }
        } catch (error) {
            console.error("Worker Error:", error);
        }
    });
};
