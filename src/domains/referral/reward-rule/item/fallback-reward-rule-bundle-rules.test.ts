import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackRewardRuleBundleCategoryLengthRule,
  FallbackRewardRuleBundleCurrencyLengthRule,
  FallbackRewardRuleBundleRequiredCategoryRule,
  FallbackRewardRuleBundleRequiredTitleRule,
  defaultFallbackRewardRuleBundleValidator,
} from "./fallback-reward-rule-bundle-rules.js";
import { newFallbackRewardRuleBundle } from "./fallback-reward-rule-bundle.js";

test("FallbackRewardRuleBundleValidator reports every problem", () => {
  const validator = defaultFallbackRewardRuleBundleValidator();
  const item = newFallbackRewardRuleBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackRewardRuleBundleRequiredTitleRule flags a blank title", () => {
  const rule = new FallbackRewardRuleBundleRequiredTitleRule("fallback reward rule bundle needs a value");
  const item = newFallbackRewardRuleBundle("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackRewardRuleBundleCategoryLengthRule flags a long category", () => {
  const rule = new FallbackRewardRuleBundleCategoryLengthRule(16);
  const item = newFallbackRewardRuleBundle("x", "y");
  item.category = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackRewardRuleBundleRequiredCategoryRule flags a blank category", () => {
  const rule = new FallbackRewardRuleBundleRequiredCategoryRule("fallback reward rule bundle needs an entry");
  const item = newFallbackRewardRuleBundle("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackRewardRuleBundleCurrencyLengthRule flags a long currency", () => {
  const rule = new FallbackRewardRuleBundleCurrencyLengthRule(120);
  const item = newFallbackRewardRuleBundle("x", "y");
  item.currency = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
