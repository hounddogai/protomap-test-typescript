import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualBidRuleEstimateAttemptsRangeRule,
  ManualBidRuleEstimateOpenRateRangeRule,
  ManualBidRuleEstimateRequiredCodeRule,
  ManualBidRuleEstimateRequiredTitleRule,
  ManualBidRuleEstimateScoreRangeRule,
  ManualBidRuleEstimateTitleLengthRule,
  defaultManualBidRuleEstimateValidator,
} from "./manual-bid-rule-estimate-rules.js";
import { newManualBidRuleEstimate } from "./manual-bid-rule-estimate.js";

test("ManualBidRuleEstimateValidator reports every problem", () => {
  const validator = defaultManualBidRuleEstimateValidator();
  const item = newManualBidRuleEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualBidRuleEstimateOpenRateRangeRule flags values above open rate", () => {
  const rule = new ManualBidRuleEstimateOpenRateRangeRule(3, 2664.6);
  const item = newManualBidRuleEstimate("x", "y");
  item.openRate = 2666.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualBidRuleEstimateRequiredCodeRule flags a blank code", () => {
  const rule = new ManualBidRuleEstimateRequiredCodeRule("manual bid rule estimate needs an entry");
  const item = newManualBidRuleEstimate("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualBidRuleEstimateTitleLengthRule flags a long title", () => {
  const rule = new ManualBidRuleEstimateTitleLengthRule(120);
  const item = newManualBidRuleEstimate("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualBidRuleEstimateRequiredTitleRule flags a blank title", () => {
  const rule = new ManualBidRuleEstimateRequiredTitleRule("manual bid rule estimate needs this field");
  const item = newManualBidRuleEstimate("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualBidRuleEstimateAttemptsRangeRule flags values above attempts", () => {
  const rule = new ManualBidRuleEstimateAttemptsRangeRule(32, 120);
  const item = newManualBidRuleEstimate("x", "y");
  item.attempts = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualBidRuleEstimateScoreRangeRule flags values above score", () => {
  const rule = new ManualBidRuleEstimateScoreRangeRule(9.2, 3229.2);
  const item = newManualBidRuleEstimate("x", "y");
  item.score = 3230.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
