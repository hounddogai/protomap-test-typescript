import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFallbackFraudCheckPolicyEngine } from "./fallback-fraud-check-policy-engine.js";
import { newFallbackFraudCheckPolicy } from "./fallback-fraud-check-policy.js";

test("FallbackFraudCheckPolicyEngine keeps results within bounds", () => {
  const engine = defaultFallbackFraudCheckPolicyEngine();
  const item = newFallbackFraudCheckPolicy("code-760", "name-796");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
