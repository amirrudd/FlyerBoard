import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();

// Storage URL handler
http.route({
  path: "/api/storage/{storageId}",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const storageId = pathParts[pathParts.length - 1];
    
    try {
      const fileUrl = await ctx.storage.getUrl(storageId as any);
      
      if (!fileUrl) {
        return new Response("File not found", { status: 404 });
      }
      
      // Redirect to the actual storage URL
      return new Response(null, {
        status: 302,
        headers: {
          Location: fileUrl,
        },
      });
    } catch (error) {
      return new Response("Invalid storage ID", { status: 400 });
    }
  }),
});

export default http;
