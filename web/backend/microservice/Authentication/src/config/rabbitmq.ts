import amqp, { Connection, Channel } from "amqplib";

let connection: Connection;
let channel: Channel;

export const connectRabbitMQ = async () => {
    try {
        const amqpServer = process.env.RABBITMQ_URL || "amqp://localhost:5672";
        connection = await amqp.connect(amqpServer) as Connection;
        channel = await connection.createChannel();
        console.log("Connected to RabbitMQ");
    } catch (error) {
        console.error("Failed to connect to RabbitMQ:", error);
    }
};

export const publishEvent = async (queue: string, data: any) => {
    if (!channel) {
        console.error("RabbitMQ channel not initialized");
        return;
    }
    await channel.assertQueue(queue);
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(data)));
};

export const getChannel = () => channel;

export const startConsumer = async (queue: string, callback: (data: any) => Promise<void>) => {
    if (!channel) {
        console.error("RabbitMQ channel not initialized");
        return;
    }
    await channel.assertQueue(queue);
    channel.consume(queue, async (msg) => {
        if (msg) {
            const content = JSON.parse(msg.content.toString());
            await callback(content);
            channel.ack(msg);
        }
    });
};
