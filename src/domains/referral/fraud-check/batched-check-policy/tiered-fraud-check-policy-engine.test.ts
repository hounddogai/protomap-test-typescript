import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTieredFraudCheckPolicyEngine } from "./tiered-fraud-check-policy-engine.js";
import { newTieredFraudCheckPolicy } from "./tiered-fraud-check-policy.js";

test("TieredFraudCheckPolicyEngine keeps results within bounds", () => {
  const engine = defaultTieredFraudCheckPolicyEngine();
  const item = newTieredFraudCheckPolicy("code-206", "name-263");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
