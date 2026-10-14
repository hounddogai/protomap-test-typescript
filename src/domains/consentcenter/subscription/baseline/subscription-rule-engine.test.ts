import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSubscriptionRuleEngine } from "./subscription-rule-engine.js";
import { newSubscriptionRule } from "./subscription-rule.js";

test("SubscriptionRuleEngine keeps results within bounds", () => {
  const engine = defaultSubscriptionRuleEngine();
  const item = newSubscriptionRule("code-272", "name-541");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
