import { InferContext } from "elysia";
import { App } from "../setup";
import { Group } from "../models/group.model";

type Context = Omit<InferContext<App>, "params"> & {
    params: Record<string, string>;
};

export const createGroupService = async (body: any, ctx: Context) => {
    try {
        const userId = ctx.headers["x-user-id"] || body.userId;
        if (!userId) {
            ctx.set.status = 401;
            return { message: "Unauthorized" };
        }

        const { name, description, privacy } = body;

        const group = new Group({
            name,
            description,
            creatorId: userId,
            privacy: privacy || "Public",
            members: [userId]
        });
        await group.save();
        return group.toObject();

    } catch (error) {
        console.error("Create Group Error:", error);
        ctx.set.status = 500;
        return { message: "Internal server error" };
    }
}

export const joinGroupService = async (params: { id: string }, body: any, ctx: Context) => {
    try {
        const userId = ctx.headers["x-user-id"] || body.userId;
        if (!userId) {
            ctx.set.status = 401;
            return { message: "Unauthorized" };
        }

        const groupId = params.id;
        const group = await Group.findById(groupId);
        if (!group) {
            ctx.set.status = 404;
            return { message: "Group not found" };
        }

        if (group.members.includes(userId)) return group.toObject();

        group.members.push(userId);
        await group.save();
        return group.toObject();

    } catch (error) {
        console.error("Join Group Error:", error);
        ctx.set.status = 500;
        return { message: "Internal server error" };
    }
}

export const getGroupConfigService = async (params: { id: string }, ctx: Context) => {
    try {
        return await Group.findById(params.id).lean();
    } catch (error) {
        ctx.set.status = 500;
        return { message: "Internal server error" };
    }
}
