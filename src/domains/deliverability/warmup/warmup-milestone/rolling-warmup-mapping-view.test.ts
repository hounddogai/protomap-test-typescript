import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingWarmupMappingView, toRollingWarmupMappingViews } from "./rolling-warmup-mapping-view.js";
import { newRollingWarmupMapping } from "./rolling-warmup-mapping.js";

test("RollingWarmupMappingView shows the status in capitals", () => {
  const item = newRollingWarmupMapping("code-794", "label-700");
  const view = toRollingWarmupMappingView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingWarmupMappingViews([item, item]).length, 2, "views");
});
