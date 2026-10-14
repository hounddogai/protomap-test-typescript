import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWeightedPreferencePolicyEngine } from "./weighted-preference-policy-engine.js";
import { newWeightedPreferencePolicy } from "./weighted-preference-policy.js";

test("WeightedPreferencePolicyEngine keeps results within bounds", () => {
  const engine = defaultWeightedPreferencePolicyEngine();
  const item = newWeightedPreferencePolicy("code-312", "name-882");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
