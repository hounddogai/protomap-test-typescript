import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLegacySubscriptionRuleEngine } from "./legacy-subscription-rule-engine.js";
import { newLegacySubscriptionRule } from "./legacy-subscription-rule.js";

test("LegacySubscriptionRuleEngine keeps results within bounds", () => {
  const engine = defaultLegacySubscriptionRuleEngine();
  const item = newLegacySubscriptionRule("code-791", "title-147");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
