import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFraudCheckPolicyEngine } from "./fraud-check-policy-engine.js";
import { newFraudCheckPolicy } from "./fraud-check-policy.js";

test("FraudCheckPolicyEngine keeps results within bounds", () => {
  const engine = defaultFraudCheckPolicyEngine();
  const item = newFraudCheckPolicy("code-866", "title-268");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
