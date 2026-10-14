import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLegacyFraudCheckRuleEngine } from "./legacy-fraud-check-rule-engine.js";
import { newLegacyFraudCheckRule } from "./legacy-fraud-check-rule.js";

test("LegacyFraudCheckRuleEngine keeps results within bounds", () => {
  const engine = defaultLegacyFraudCheckRuleEngine();
  const item = newLegacyFraudCheckRule("code-511", "title-556");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
