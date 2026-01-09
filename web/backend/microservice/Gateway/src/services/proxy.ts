import { Context } from "elysia";

export const proxyRequest = async (
    serviceUrl: string,
    path: string,
    ctx: Context,
) => {
    const url = `${serviceUrl}${path}`;
    const method = ctx.request.method;
    const headers = new Headers(ctx.request.headers);

    let body: any = undefined;
    if (method !== "GET" && method !== "HEAD") {
        // If body is already used/parsed by Elysia, we might not be able to read it again as stream
        // safely clone it if we want to read text, OR just use ctx.body if Elysia parsed it
        if (ctx.body) {
            body = JSON.stringify(ctx.body);
        } else {
            try {
                // Fallback if body not parsed yet
                body = await ctx.request.text();
            } catch (e) {
                // If body used, try cloning
                body = await ctx.request.clone().text();
            }
        }
    }

    try {
        const response = await fetch(url, {
            method,
            headers,
            body,
        });

        // Handle response headers
        const responseHeaders = new Headers(response.headers);

        // Return the response with correct status and headers
        return new Response(response.body, {
            status: response.status,
            headers: responseHeaders,
        });
    } catch (error) {
        console.error(`Proxy error to ${url}:`, error);
        return new Response("Service Unavailable", { status: 503 });
    }
};
