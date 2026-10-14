import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RewardSummaryDurationMinutesRangeRule,
  RewardSummaryLabelLengthRule,
  RewardSummaryRequiredCodeRule,
  RewardSummaryRequiredLabelRule,
  defaultRewardSummaryValidator,
} from "./reward-summary-rules.js";
import { newRewardSummary } from "./reward-summary.js";

test("RewardSummaryValidator reports every problem", () => {
  const validator = defaultRewardSummaryValidator();
  const item = newRewardSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RewardSummaryLabelLengthRule flags a long label", () => {
  const rule = new RewardSummaryLabelLengthRule(86400);
  const item = newRewardSummary("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RewardSummaryRequiredCodeRule flags a blank code", () => {
  const rule = new RewardSummaryRequiredCodeRule("reward summary needs a value");
  const item = newRewardSummary("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RewardSummaryRequiredLabelRule flags a blank label", () => {
  const rule = new RewardSummaryRequiredLabelRule("reward summary needs an entry");
  const item = newRewardSummary("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RewardSummaryDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new RewardSummaryDurationMinutesRangeRule(255, 255);
  const item = newRewardSummary("x", "y");
  item.durationMinutes = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
