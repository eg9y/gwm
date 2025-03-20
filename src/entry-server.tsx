import { renderToString } from "react-dom/server";
import { StrictMode, Suspense } from "react";
import { RouterProvider, createMemoryHistory } from "@tanstack/react-router";
import { router } from "./router";

export async function render(url: string) {
  // Create a memory history and update the router
  const memoryHistory = createMemoryHistory({
    initialEntries: [url],
  });

  // Update the router with the server-side history
  router.update({
    history: memoryHistory,
  });

  // Load any necessary data for the current route
  await router.load();

  // Determine if the current route has a not-found match
  const statusCode = router.hasNotFoundMatch() ? 404 : 200;

  // Render the app to HTML with the same structure as the client
  const appHtml = renderToString(
    <StrictMode>
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-screen bg-white animate-fade-in">
            <div className="text-primary">
              <div className="animate-pulse flex flex-col items-center">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-lg font-medium">Loading GWM Indonesia...</p>
              </div>
            </div>
          </div>
        }
      >
        <RouterProvider router={router} />
      </Suspense>
    </StrictMode>
  );

  // Get head metadata
  let headTags = "";

  try {
    // Access the router's current match data
    // We need to use any type here as we're accessing internal properties
    const routerState = router.state as unknown;
    const matches = (routerState as any)?.matches || [];
    const lastMatch = matches.length > 0 ? matches[matches.length - 1] : null;

    if (lastMatch?.route?.options) {
      const headConfig = lastMatch.route.options.head;
      const loaderData = lastMatch.loaderData;

      if (typeof headConfig === "function") {
        // Call the head function with context
        const headResult = headConfig({ loaderData });

        // Process title
        if (headResult.title) {
          headTags += `<title>${headResult.title}</title>\n`;
        }

        // Process meta tags
        if (headResult.meta && Array.isArray(headResult.meta)) {
          for (const meta of headResult.meta) {
            // Handle special case for title in meta
            if (meta.title) {
              headTags += `<title>${meta.title}</title>\n`;
              continue;
            }

            const metaAttrs = Object.entries(meta)
              .map(([key, value]) => `${key}="${value}"`)
              .join(" ");
            headTags += `<meta ${metaAttrs}>\n`;
          }
        }

        // Process link tags
        if (headResult.links && Array.isArray(headResult.links)) {
          for (const link of headResult.links) {
            const linkAttrs = Object.entries(link)
              .map(([key, value]) => `${key}="${value}"`)
              .join(" ");
            headTags += `<link ${linkAttrs}>\n`;
          }
        }
      }
    }

    // Add the View Transition API support meta tag
    headTags += `<meta name="view-transition" content="same-origin">\n`;
  } catch (error) {
    console.error("Error generating head tags:", error);
    // Fallback title
    headTags = "<title>GWM Indonesia</title>\n";
  }

  return {
    appHtml,
    headTags,
    statusCode,
  };
}
