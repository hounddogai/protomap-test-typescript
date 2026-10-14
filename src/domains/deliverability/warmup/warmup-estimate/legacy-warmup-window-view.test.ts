import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyWarmupWindowView, toLegacyWarmupWindowViews } from "./legacy-warmup-window-view.js";
import { newLegacyWarmupWindow } from "./legacy-warmup-window.js";

test("LegacyWarmupWindowView shows the status in capitals", () => {
  const item = newLegacyWarmupWindow("code-712", "name-828");
  const view = toLegacyWarmupWindowView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyWarmupWindowViews([item, item]).length, 2, "views");
});
