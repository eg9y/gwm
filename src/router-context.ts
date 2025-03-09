import type { RegisteredRouter } from "@tanstack/react-router";
import type { routeTree } from "./routeTree.gen";

export interface RouterContext {
  router: RegisteredRouter<typeof routeTree>;
}
