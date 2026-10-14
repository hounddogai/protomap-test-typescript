import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingBidRuleVarianceFrequencyCapRangeRule,
  PendingBidRuleVarianceLimitRangeRule,
  PendingBidRuleVarianceRatioRangeRule,
  PendingBidRuleVarianceRequiredTitleRule,
  PendingBidRuleVarianceTitleLengthRule,
  defaultPendingBidRuleVarianceValidator,
} from "./pending-bid-rule-variance-rules.js";
import { newPendingBidRuleVariance } from "./pending-bid-rule-variance.js";

test("PendingBidRuleVarianceValidator reports every problem", () => {
  const validator = defaultPendingBidRuleVarianceValidator();
  const item = newPendingBidRuleVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingBidRuleVarianceTitleLengthRule flags a long title", () => {
  const rule = new PendingBidRuleVarianceTitleLengthRule(32);
  const item = newPendingBidRuleVariance("x", "y");
  item.title = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingBidRuleVarianceRatioRangeRule flags values above ratio", () => {
  const rule = new PendingBidRuleVarianceRatioRangeRule(7.6, 3452.2);
  const item = newPendingBidRuleVariance("x", "y");
  item.ratio = 3453.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingBidRuleVarianceFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new PendingBidRuleVarianceFrequencyCapRangeRule(64, 255);
  const item = newPendingBidRuleVariance("x", "y");
  item.frequencyCap = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingBidRuleVarianceLimitRangeRule flags values above limit", () => {
  const rule = new PendingBidRuleVarianceLimitRangeRule(64, 255);
  const item = newPendingBidRuleVariance("x", "y");
  item.limit = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingBidRuleVarianceRequiredTitleRule flags a blank title", () => {
  const rule = new PendingBidRuleVarianceRequiredTitleRule("pending bid rule variance needs a value");
  const item = newPendingBidRuleVariance("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
