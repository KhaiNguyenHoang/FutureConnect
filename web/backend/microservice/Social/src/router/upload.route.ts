
import { Elysia, t } from "elysia";
import { validateAndSaveFile } from "../service/upload.service";

const uploadRoute = new Elysia({ prefix: "/upload" })
    .post("/", async (ctx) => {
        const { file } = ctx.body;
        if (!file) {
            ctx.set.status = 400;
            return { message: "No file uploaded" };
        }
        return await validateAndSaveFile(file);
    }, {
        body: t.Object({
            file: t.File()
        })
    });

export default uploadRoute;
