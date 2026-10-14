import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyWarmupAllocationView, toLegacyWarmupAllocationViews } from "./legacy-warmup-allocation-view.js";
import { newLegacyWarmupAllocation } from "./legacy-warmup-allocation.js";

test("LegacyWarmupAllocationView shows the status in capitals", () => {
  const item = newLegacyWarmupAllocation("code-791", "name-120");
  const view = toLegacyWarmupAllocationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyWarmupAllocationViews([item, item]).length, 2, "views");
});
