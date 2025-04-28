import { jsx } from "react/jsx-runtime";
import { Suspense, lazy } from "react";
const Contact = lazy(() => import("./Contact-Bx2gOO_I.js"));
const SplitComponent = function ContactPage() {
  return /* @__PURE__ */ jsx(Suspense, { fallback: /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsx("div", { className: "animate-pulse text-primary", children: "Loading..." }) }), children: /* @__PURE__ */ jsx(Contact, {}) });
};
export {
  SplitComponent as component
};
