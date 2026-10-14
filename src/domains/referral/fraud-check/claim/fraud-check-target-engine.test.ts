import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFraudCheckTargetEngine } from "./fraud-check-target-engine.js";
import { newFraudCheckTarget } from "./fraud-check-target.js";

test("FraudCheckTargetEngine keeps results within bounds", () => {
  const engine = defaultFraudCheckTargetEngine(flags.newRegistry());
  const item = newFraudCheckTarget("code-2", "name-459");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
