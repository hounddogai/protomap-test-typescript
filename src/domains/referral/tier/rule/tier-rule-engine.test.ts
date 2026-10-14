import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTierRuleEngine } from "./tier-rule-engine.js";
import { newTierRule } from "./tier-rule.js";

test("TierRuleEngine keeps results within bounds", () => {
  const engine = defaultTierRuleEngine();
  const item = newTierRule("code-50", "label-535");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
