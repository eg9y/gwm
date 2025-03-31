/// <reference types="vinxi/types/server" />
// Load environment variables first
import dotenv from "dotenv";
dotenv.config();

import {
  createStartHandler,
  defaultStreamHandler,
} from "@tanstack/react-start/server";
import { getRouterManifest } from "@tanstack/react-start/router-manifest";
import { createRouter } from "./router";

// Log for debugging (remove in production)
console.log(
  "Server environment loaded, reCAPTCHA key available:",
  !!process.env.RECAPTCHA_SECRET_KEY
);

// Create the standard handler (no Clerk)
const handler = createStartHandler({
  createRouter,
  getRouterManifest,
})(defaultStreamHandler);

// Export the handler
export default handler;
