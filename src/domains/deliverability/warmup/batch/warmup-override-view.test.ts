import assert from "node:assert/strict";
import { test } from "node:test";
import { toWarmupOverrideView, toWarmupOverrideViews } from "./warmup-override-view.js";
import { newWarmupOverride } from "./warmup-override.js";

test("WarmupOverrideView shows the status in capitals", () => {
  const item = newWarmupOverride("code-91", "name-670");
  const view = toWarmupOverrideView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWarmupOverrideViews([item, item]).length, 2, "views");
});
