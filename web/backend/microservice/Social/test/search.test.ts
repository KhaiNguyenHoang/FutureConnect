
import { describe, expect, it, mock, beforeAll } from "bun:test";
import { searchService } from "../src/service/search.service";
import { Post } from "../src/models/post.model";

describe("Search Service", () => {
    beforeAll(() => {
        // Mock mongoose models used in searchService
        mock.module("../src/models/post.model", () => ({
            Post: {
                find: mock(() => ({
                    skip: mock(() => ({
                        limit: mock(() => ({
                            lean: mock(() => Promise.resolve([{ content: "test post" }]))
                        }))
                    }))
                })),
                countDocuments: mock(() => Promise.resolve(1))
            }
        }));
    });

    it("should return paginated results for posts", async () => {
        const result = await searchService({
            q: "test",
            type: "post",
            page: "1",
            limit: "10"
        }, {} as any);

        expect(result).toEqual({
            data: [{ content: "test post" }],
            metadata: {
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1
            }
        });
    });

    it("should handle empty query", async () => {
        const result = await searchService({ q: "" }, {} as any);
        expect(result).toEqual({
            data: [],
            metadata: { total: 0, page: 1, limit: 20 }
        });
    });
});
