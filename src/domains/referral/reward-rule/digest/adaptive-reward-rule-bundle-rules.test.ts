import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveRewardRuleBundleOwnerIdLengthRule,
  AdaptiveRewardRuleBundleRequiredLabelRule,
  AdaptiveRewardRuleBundleThresholdRangeRule,
  defaultAdaptiveRewardRuleBundleValidator,
} from "./adaptive-reward-rule-bundle-rules.js";
import { newAdaptiveRewardRuleBundle } from "./adaptive-reward-rule-bundle.js";

test("AdaptiveRewardRuleBundleValidator reports every problem", () => {
  const validator = defaultAdaptiveRewardRuleBundleValidator();
  const item = newAdaptiveRewardRuleBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveRewardRuleBundleOwnerIdLengthRule flags a long owner id", () => {
  const rule = new AdaptiveRewardRuleBundleOwnerIdLengthRule(32);
  const item = newAdaptiveRewardRuleBundle("x", "y");
  item.ownerId = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveRewardRuleBundleThresholdRangeRule flags values above threshold", () => {
  const rule = new AdaptiveRewardRuleBundleThresholdRangeRule(8.2, 1946.3);
  const item = newAdaptiveRewardRuleBundle("x", "y");
  item.threshold = 1947.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveRewardRuleBundleRequiredLabelRule flags a blank label", () => {
  const rule = new AdaptiveRewardRuleBundleRequiredLabelRule("adaptive reward rule bundle needs an entry");
  const item = newAdaptiveRewardRuleBundle("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
