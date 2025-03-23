/// <reference types="vinxi/types/server" />
// Load environment variables first
import dotenv from "dotenv";
dotenv.config();

import {
  createStartHandler,
  defaultStreamHandler,
} from "@tanstack/react-start/server";
import { getRouterManifest } from "@tanstack/react-start/router-manifest";
import { createClerkHandler } from "@clerk/tanstack-start/server";

import { createRouter } from "./router";

// Log for debugging (remove in production)
console.log(
  "Server environment loaded, reCAPTCHA key available:",
  !!process.env.RECAPTCHA_SECRET_KEY
);

export default createClerkHandler(
  createStartHandler({
    createRouter,
    getRouterManifest,
  })
)(defaultStreamHandler);
