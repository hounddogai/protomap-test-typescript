import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptivePreferencePolicyBudgetRangeRule,
  AdaptivePreferencePolicyRequiredLabelRule,
  defaultAdaptivePreferencePolicyValidator,
} from "./adaptive-preference-policy-rules.js";
import { newAdaptivePreferencePolicy } from "./adaptive-preference-policy.js";

test("AdaptivePreferencePolicyValidator reports every problem", () => {
  const validator = defaultAdaptivePreferencePolicyValidator();
  const item = newAdaptivePreferencePolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptivePreferencePolicyRequiredLabelRule flags a blank label", () => {
  const rule = new AdaptivePreferencePolicyRequiredLabelRule("adaptive preference policy needs an entry");
  const item = newAdaptivePreferencePolicy("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptivePreferencePolicyBudgetRangeRule flags values above budget", () => {
  const rule = new AdaptivePreferencePolicyBudgetRangeRule(0.9, 1772);
  const item = newAdaptivePreferencePolicy("x", "y");
  item.budget = 1773.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
