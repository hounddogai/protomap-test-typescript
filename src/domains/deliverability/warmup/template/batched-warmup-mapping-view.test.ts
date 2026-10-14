import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedWarmupMappingView, toBatchedWarmupMappingViews } from "./batched-warmup-mapping-view.js";
import { newBatchedWarmupMapping } from "./batched-warmup-mapping.js";

test("BatchedWarmupMappingView shows the status in capitals", () => {
  const item = newBatchedWarmupMapping("code-752", "title-98");
  const view = toBatchedWarmupMappingView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedWarmupMappingViews([item, item]).length, 2, "views");
});
