import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultAdaptiveSuppressionPolicyEngine } from "./adaptive-suppression-policy-engine.js";
import { newAdaptiveSuppressionPolicy } from "./adaptive-suppression-policy.js";

test("AdaptiveSuppressionPolicyEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveSuppressionPolicyEngine();
  const item = newAdaptiveSuppressionPolicy("code-243", "label-326");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
