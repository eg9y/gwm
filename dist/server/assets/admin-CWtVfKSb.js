import { jsx } from "react/jsx-runtime";
import { Navigate } from "@tanstack/react-router";
import { S as STRAPI_API_URL } from "../entry-server.js";
import "react-dom/server";
import "react";
const SplitComponent = function AdminRedirect() {
  const adminUrl = `${STRAPI_API_URL}/admin`;
  window.location.href = adminUrl;
  return /* @__PURE__ */ jsx(Navigate, { to: "/" });
};
export {
  SplitComponent as component
};
