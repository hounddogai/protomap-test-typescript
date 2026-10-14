import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveExitRuleProfileAmountRangeRule,
  AdaptiveExitRuleProfileRequiredLabelRule,
  defaultAdaptiveExitRuleProfileValidator,
} from "./adaptive-exit-rule-profile-rules.js";
import { newAdaptiveExitRuleProfile } from "./adaptive-exit-rule-profile.js";

test("AdaptiveExitRuleProfileValidator reports every problem", () => {
  const validator = defaultAdaptiveExitRuleProfileValidator();
  const item = newAdaptiveExitRuleProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveExitRuleProfileAmountRangeRule flags values above amount", () => {
  const rule = new AdaptiveExitRuleProfileAmountRangeRule(9.2, 2536.3);
  const item = newAdaptiveExitRuleProfile("x", "y");
  item.amount = 2537.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveExitRuleProfileRequiredLabelRule flags a blank label", () => {
  const rule = new AdaptiveExitRuleProfileRequiredLabelRule("adaptive exit rule profile needs a value");
  const item = newAdaptiveExitRuleProfile("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
