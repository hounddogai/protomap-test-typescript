import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPaywallPolicyEngine } from "./paywall-policy-engine.js";
import { newPaywallPolicy } from "./paywall-policy.js";

test("PaywallPolicyEngine keeps results within bounds", () => {
  const engine = defaultPaywallPolicyEngine();
  const item = newPaywallPolicy("code-804", "name-518");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
