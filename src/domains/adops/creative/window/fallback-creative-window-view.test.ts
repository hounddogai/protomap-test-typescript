import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackCreativeWindowView, toFallbackCreativeWindowViews } from "./fallback-creative-window-view.js";
import { newFallbackCreativeWindow } from "./fallback-creative-window.js";

test("FallbackCreativeWindowView shows the status in capitals", () => {
  const item = newFallbackCreativeWindow("code-561", "label-880");
  const view = toFallbackCreativeWindowView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackCreativeWindowViews([item, item]).length, 2, "views");
});
