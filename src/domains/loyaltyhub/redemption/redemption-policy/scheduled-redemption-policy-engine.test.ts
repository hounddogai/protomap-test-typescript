import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultScheduledRedemptionPolicyEngine } from "./scheduled-redemption-policy-engine.js";
import { newScheduledRedemptionPolicy } from "./scheduled-redemption-policy.js";

test("ScheduledRedemptionPolicyEngine keeps results within bounds", () => {
  const engine = defaultScheduledRedemptionPolicyEngine();
  const item = newScheduledRedemptionPolicy("code-715", "title-653");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
