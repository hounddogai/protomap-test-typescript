import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRedemptionPolicyEngine } from "./redemption-policy-engine.js";
import { newRedemptionPolicy } from "./redemption-policy.js";

test("RedemptionPolicyEngine keeps results within bounds", () => {
  const engine = defaultRedemptionPolicyEngine();
  const item = newRedemptionPolicy("code-450", "label-289");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
