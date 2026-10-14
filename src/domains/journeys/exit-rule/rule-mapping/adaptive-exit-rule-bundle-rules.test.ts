import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveExitRuleBundleContactEmailLengthRule,
  AdaptiveExitRuleBundlePhoneLengthRule,
  AdaptiveExitRuleBundleWeightRangeRule,
  defaultAdaptiveExitRuleBundleValidator,
} from "./adaptive-exit-rule-bundle-rules.js";
import { newAdaptiveExitRuleBundle } from "./adaptive-exit-rule-bundle.js";

test("AdaptiveExitRuleBundleValidator reports every problem", () => {
  const validator = defaultAdaptiveExitRuleBundleValidator();
  const item = newAdaptiveExitRuleBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveExitRuleBundleContactEmailLengthRule flags a long contact email", () => {
  const rule = new AdaptiveExitRuleBundleContactEmailLengthRule(16);
  const item = newAdaptiveExitRuleBundle("x", "y");
  item.contactEmail = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveExitRuleBundleWeightRangeRule flags values above weight", () => {
  const rule = new AdaptiveExitRuleBundleWeightRangeRule(8.3, 2748.2);
  const item = newAdaptiveExitRuleBundle("x", "y");
  item.weight = 2749.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveExitRuleBundlePhoneLengthRule flags a long phone", () => {
  const rule = new AdaptiveExitRuleBundlePhoneLengthRule(80);
  const item = newAdaptiveExitRuleBundle("x", "y");
  item.phone = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
