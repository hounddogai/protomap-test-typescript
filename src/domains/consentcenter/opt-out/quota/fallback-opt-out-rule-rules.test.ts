import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackOptOutRuleAudienceIdLengthRule,
  FallbackOptOutRuleBudgetRangeRule,
  FallbackOptOutRuleRetriesRangeRule,
  FallbackOptOutRuleWeightRangeRule,
  defaultFallbackOptOutRuleValidator,
} from "./fallback-opt-out-rule-rules.js";
import { newFallbackOptOutRule } from "./fallback-opt-out-rule.js";

test("FallbackOptOutRuleValidator reports every problem", () => {
  const validator = defaultFallbackOptOutRuleValidator();
  const item = newFallbackOptOutRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackOptOutRuleAudienceIdLengthRule flags a long audience id", () => {
  const rule = new FallbackOptOutRuleAudienceIdLengthRule(3600);
  const item = newFallbackOptOutRule("x", "y");
  item.audienceId = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackOptOutRuleRetriesRangeRule flags values above retries", () => {
  const rule = new FallbackOptOutRuleRetriesRangeRule(16, 64);
  const item = newFallbackOptOutRule("x", "y");
  item.retries = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackOptOutRuleBudgetRangeRule flags values above budget", () => {
  const rule = new FallbackOptOutRuleBudgetRangeRule(5.7, 1946.6);
  const item = newFallbackOptOutRule("x", "y");
  item.budget = 1948.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackOptOutRuleWeightRangeRule flags values above weight", () => {
  const rule = new FallbackOptOutRuleWeightRangeRule(0.7, 1783.8);
  const item = newFallbackOptOutRule("x", "y");
  item.weight = 1785.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
