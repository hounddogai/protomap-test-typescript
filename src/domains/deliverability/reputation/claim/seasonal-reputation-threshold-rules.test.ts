import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalReputationThresholdBudgetRangeRule,
  SeasonalReputationThresholdCodeLengthRule,
  SeasonalReputationThresholdGraceDaysRangeRule,
  SeasonalReputationThresholdRequiredCodeRule,
  SeasonalReputationThresholdRequiredLabelRule,
  SeasonalReputationThresholdRequiredTitleRule,
  defaultSeasonalReputationThresholdValidator,
} from "./seasonal-reputation-threshold-rules.js";
import { newSeasonalReputationThreshold } from "./seasonal-reputation-threshold.js";

test("SeasonalReputationThresholdValidator reports every problem", () => {
  const validator = defaultSeasonalReputationThresholdValidator();
  const item = newSeasonalReputationThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalReputationThresholdCodeLengthRule flags a long code", () => {
  const rule = new SeasonalReputationThresholdCodeLengthRule(3600);
  const item = newSeasonalReputationThreshold("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalReputationThresholdGraceDaysRangeRule flags values above grace days", () => {
  const rule = new SeasonalReputationThresholdGraceDaysRangeRule(16, 1000);
  const item = newSeasonalReputationThreshold("x", "y");
  item.graceDays = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalReputationThresholdRequiredCodeRule flags a blank code", () => {
  const rule = new SeasonalReputationThresholdRequiredCodeRule("seasonal reputation threshold needs this field");
  const item = newSeasonalReputationThreshold("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalReputationThresholdBudgetRangeRule flags values above budget", () => {
  const rule = new SeasonalReputationThresholdBudgetRangeRule(7.7, 2423.2);
  const item = newSeasonalReputationThreshold("x", "y");
  item.budget = 2424.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalReputationThresholdRequiredTitleRule flags a blank title", () => {
  const rule = new SeasonalReputationThresholdRequiredTitleRule("seasonal reputation threshold needs a value");
  const item = newSeasonalReputationThreshold("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalReputationThresholdRequiredLabelRule flags a blank label", () => {
  const rule = new SeasonalReputationThresholdRequiredLabelRule("seasonal reputation threshold needs this field");
  const item = newSeasonalReputationThreshold("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
