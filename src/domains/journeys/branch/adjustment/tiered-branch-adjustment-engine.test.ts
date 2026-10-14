import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTieredBranchAdjustmentEngine } from "./tiered-branch-adjustment-engine.js";
import { newTieredBranchAdjustment } from "./tiered-branch-adjustment.js";

test("TieredBranchAdjustmentEngine keeps results within bounds", () => {
  const engine = defaultTieredBranchAdjustmentEngine();
  const item = newTieredBranchAdjustment("code-478", "label-795");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
