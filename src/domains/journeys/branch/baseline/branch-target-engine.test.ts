import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBranchTargetEngine } from "./branch-target-engine.js";
import { newBranchTarget } from "./branch-target.js";

test("BranchTargetEngine keeps results within bounds", () => {
  const engine = defaultBranchTargetEngine();
  const item = newBranchTarget("code-806", "label-138");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
