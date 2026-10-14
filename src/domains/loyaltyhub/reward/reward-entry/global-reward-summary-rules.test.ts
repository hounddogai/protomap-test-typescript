import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalRewardSummaryAttemptsRangeRule,
  GlobalRewardSummaryMinimumRangeRule,
  GlobalRewardSummaryRequiredCodeRule,
  GlobalRewardSummaryRequiredRegionRule,
  GlobalRewardSummaryRequiredTitleRule,
  defaultGlobalRewardSummaryValidator,
} from "./global-reward-summary-rules.js";
import { newGlobalRewardSummary } from "./global-reward-summary.js";

test("GlobalRewardSummaryValidator reports every problem", () => {
  const validator = defaultGlobalRewardSummaryValidator();
  const item = newGlobalRewardSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalRewardSummaryRequiredTitleRule flags a blank title", () => {
  const rule = new GlobalRewardSummaryRequiredTitleRule("global reward summary needs an entry");
  const item = newGlobalRewardSummary("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalRewardSummaryMinimumRangeRule flags values above minimum", () => {
  const rule = new GlobalRewardSummaryMinimumRangeRule(9, 3454.3);
  const item = newGlobalRewardSummary("x", "y");
  item.minimum = 3455.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalRewardSummaryRequiredRegionRule flags a blank region", () => {
  const rule = new GlobalRewardSummaryRequiredRegionRule("global reward summary needs an entry");
  const item = newGlobalRewardSummary("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalRewardSummaryRequiredCodeRule flags a blank code", () => {
  const rule = new GlobalRewardSummaryRequiredCodeRule("global reward summary needs a value");
  const item = newGlobalRewardSummary("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalRewardSummaryAttemptsRangeRule flags values above attempts", () => {
  const rule = new GlobalRewardSummaryAttemptsRangeRule(3600, 86400);
  const item = newGlobalRewardSummary("x", "y");
  item.attempts = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
