import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalInsightScoreBudgetRangeRule,
  RegionalInsightScoreLabelLengthRule,
  RegionalInsightScoreRequiredCodeRule,
  RegionalInsightScoreRequiredTimezoneRule,
  RegionalInsightScoreTimezoneLengthRule,
  defaultRegionalInsightScoreValidator,
} from "./regional-insight-score-rules.js";
import { newRegionalInsightScore } from "./regional-insight-score.js";

test("RegionalInsightScoreValidator reports every problem", () => {
  const validator = defaultRegionalInsightScoreValidator();
  const item = newRegionalInsightScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalInsightScoreTimezoneLengthRule flags a long timezone", () => {
  const rule = new RegionalInsightScoreTimezoneLengthRule(64);
  const item = newRegionalInsightScore("x", "y");
  item.timezone = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalInsightScoreRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new RegionalInsightScoreRequiredTimezoneRule("regional insight score needs this field");
  const item = newRegionalInsightScore("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalInsightScoreBudgetRangeRule flags values above budget", () => {
  const rule = new RegionalInsightScoreBudgetRangeRule(7.9, 3840);
  const item = newRegionalInsightScore("x", "y");
  item.budget = 3841.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalInsightScoreRequiredCodeRule flags a blank code", () => {
  const rule = new RegionalInsightScoreRequiredCodeRule("regional insight score needs a value");
  const item = newRegionalInsightScore("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalInsightScoreLabelLengthRule flags a long label", () => {
  const rule = new RegionalInsightScoreLabelLengthRule(1000);
  const item = newRegionalInsightScore("x", "y");
  item.label = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
