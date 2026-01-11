import amqp from "amqplib";

const rabbitUrl = Bun.env.RABBITMQ_URL || "amqp://localhost:5672";

let channel: amqp.Channel | null = null;

export const connectRabbitMQ = async () => {
    try {
        const connection = await amqp.connect(rabbitUrl);
        channel = await connection.createChannel();
        await channel.assertExchange("social_events", "topic", { durable: true });
        console.log("Connected to RabbitMQ");
    } catch (error) {
        console.error("Error connecting to RabbitMQ:", error);
    }
};

export const publishEvent = async (routingKey: string, data: any) => {
    if (!channel) {
        console.warn("RabbitMQ channel not ready, skipping event publish");
        return;
    }
    channel.publish("social_events", routingKey, Buffer.from(JSON.stringify(data)));
};
