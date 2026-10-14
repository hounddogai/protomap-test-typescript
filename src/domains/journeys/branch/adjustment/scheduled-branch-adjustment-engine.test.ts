import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultScheduledBranchAdjustmentEngine } from "./scheduled-branch-adjustment-engine.js";
import { newScheduledBranchAdjustment } from "./scheduled-branch-adjustment.js";

test("ScheduledBranchAdjustmentEngine keeps results within bounds", () => {
  const engine = defaultScheduledBranchAdjustmentEngine();
  const item = newScheduledBranchAdjustment("code-927", "name-69");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
