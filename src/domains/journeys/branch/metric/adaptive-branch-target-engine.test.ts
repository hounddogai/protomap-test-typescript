import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptiveBranchTargetEngine } from "./adaptive-branch-target-engine.js";
import { newAdaptiveBranchTarget } from "./adaptive-branch-target.js";

test("AdaptiveBranchTargetEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveBranchTargetEngine(flags.newRegistry());
  const item = newAdaptiveBranchTarget("code-845", "name-937");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
