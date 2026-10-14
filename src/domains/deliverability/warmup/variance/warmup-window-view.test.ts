import assert from "node:assert/strict";
import { test } from "node:test";
import { toWarmupWindowView, toWarmupWindowViews } from "./warmup-window-view.js";
import { newWarmupWindow } from "./warmup-window.js";

test("WarmupWindowView shows the status in capitals", () => {
  const item = newWarmupWindow("code-310", "name-987");
  const view = toWarmupWindowView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWarmupWindowViews([item, item]).length, 2, "views");
});
