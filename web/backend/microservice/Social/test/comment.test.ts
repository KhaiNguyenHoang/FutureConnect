
import { describe, expect, it, mock, beforeAll } from "bun:test";
import { addCommentService, getCommentsService, getRepliesService } from "../src/service/comment.service";

describe("Comment Service", () => {
    beforeAll(() => {
        mock.module("../src/models/post.model", () => ({
            Post: {
                findById: mock((id) => Promise.resolve(id === "valid-post" ? { _id: "valid-post" } : null))
            }
        }));

        mock.module("../src/models/comment.model", () => ({
            Comment: class {
                _id = "new-comment-id";
                content = "";
                postId = "";
                parentId = null;
                authorId = "";
                stats = { replyCount: 0 };

                constructor(data: any) {
                    Object.assign(this, data);
                }
                save() { return Promise.resolve(this); }
                toObject() { return { ...this, _id: this._id }; }

                static findById = mock((id) => Promise.resolve(id === "parent-comment" ? { _id: "parent-comment", postId: "valid-post" } : null));
                static findByIdAndUpdate = mock(() => Promise.resolve({}));
                static find = mock(() => ({
                    sort: mock(() => ({
                        skip: mock(() => ({
                            limit: mock(() => ({
                                lean: mock(() => Promise.resolve([]))
                            }))
                        }))
                    }))
                }));
                static countDocuments = mock(() => Promise.resolve(0));
            }
        }));
    });

    it("should add a comment to a post", async () => {
        const result = await addCommentService({
            content: "Test comment",
            postId: "valid-post"
        }, { headers: { "x-user-id": "user1" } } as any);

        expect(result).toBeDefined();
        expect(result.content).toBe("Test comment");
    });

    it("should fail if post does not exist", async () => {
        const ctx: any = { headers: { "x-user-id": "user1" }, set: {} };
        const result = await addCommentService({
            content: "Test comment",
            postId: "invalid-post"
        }, ctx);

        expect(ctx.set.status).toBe(404);
        expect(result.message).toBe("Post not found");
    });

    it("should add a reply to a comment", async () => {
        const result = await addCommentService({
            content: "Test reply",
            postId: "valid-post",
            parentId: "parent-comment"
        }, { headers: { "x-user-id": "user1" } } as any);

        expect(result).toBeDefined();
        expect(result.parentId).toBe("parent-comment");
    });

    it("should fail if parent comment does not exist", async () => {
        const ctx: any = { headers: { "x-user-id": "user1" }, set: {} };
        const result = await addCommentService({
            content: "Test reply",
            postId: "valid-post",
            parentId: "invalid-parent"
        }, ctx);

        expect(ctx.set.status).toBe(404);
        expect(result.message).toBe("Parent comment not found");
    });
});
