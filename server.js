import path from "node:path";
import express from "express";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === "production";

async function createServer() {
  const app = express();

  let vite;

  if (!isProduction) {
    // In development: Create Vite dev server in middleware mode
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });

    // Use Vite's connect instance as middleware
    app.use(vite.middlewares);
  } else {
    // In production: Serve static assets from dist/client
    app.use(
      express.static(path.resolve(__dirname, "dist/client"), {
        index: false,
      })
    );
  }

  app.use("*", async (req, res) => {
    const url = req.originalUrl;

    try {
      let template, entryServer;

      if (!isProduction) {
        // In development: Get fresh template and transform it with Vite
        template = fs.readFileSync(
          path.resolve(__dirname, "index.html"),
          "utf-8"
        );
        template = await vite.transformIndexHtml(url, template);
        entryServer = await vite.ssrLoadModule("/src/entry-server.tsx");
      } else {
        // In production: Use built templates and modules
        template = fs.readFileSync(
          path.resolve(__dirname, "dist/client/index.html"),
          "utf-8"
        );
        entryServer = await import("./dist/server/entry-server.js");
      }

      // Render the app HTML
      const { render } = entryServer;
      const { appHtml, headTags, statusCode } = await render(url);

      // Inject the rendered app and head tags into the template
      const html = template
        .replace("<!--app-html-->", appHtml)
        .replace("<!--head-tags-->", headTags || "");

      // Send the rendered HTML to the client
      res
        .status(statusCode || 200)
        .set({ "Content-Type": "text/html" })
        .end(html);
    } catch (e) {
      // If an error occurred, let Vite fix the stack trace in dev
      if (!isProduction && vite) {
        vite.ssrFixStacktrace(e);
      }
      console.error(e);
      res.status(500).end(e.stack);
    }
  });

  const port = process.env.PORT || 5177;
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

createServer();
