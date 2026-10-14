import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWeightedOptOutPolicyEngine } from "./weighted-opt-out-policy-engine.js";
import { newWeightedOptOutPolicy } from "./weighted-opt-out-policy.js";

test("WeightedOptOutPolicyEngine keeps results within bounds", () => {
  const engine = defaultWeightedOptOutPolicyEngine();
  const item = newWeightedOptOutPolicy("code-162", "label-320");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
