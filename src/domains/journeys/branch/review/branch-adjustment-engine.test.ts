import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBranchAdjustmentEngine } from "./branch-adjustment-engine.js";
import { newBranchAdjustment } from "./branch-adjustment.js";

test("BranchAdjustmentEngine keeps results within bounds", () => {
  const engine = defaultBranchAdjustmentEngine(flags.newRegistry());
  const item = newBranchAdjustment("code-828", "name-884");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
