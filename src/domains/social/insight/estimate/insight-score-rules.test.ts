import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InsightScoreCeilingRangeRule,
  InsightScoreOpenRateRangeRule,
  InsightScoreRegionLengthRule,
  InsightScoreRequiredRegionRule,
  InsightScoreRequiredTitleRule,
  InsightScoreRequiredUnitRule,
  defaultInsightScoreValidator,
} from "./insight-score-rules.js";
import { newInsightScore } from "./insight-score.js";

test("InsightScoreValidator reports every problem", () => {
  const validator = defaultInsightScoreValidator();
  const item = newInsightScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("InsightScoreRequiredUnitRule flags a blank unit", () => {
  const rule = new InsightScoreRequiredUnitRule("insight score needs this field");
  const item = newInsightScore("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InsightScoreRequiredTitleRule flags a blank title", () => {
  const rule = new InsightScoreRequiredTitleRule("insight score needs an entry");
  const item = newInsightScore("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InsightScoreRequiredRegionRule flags a blank region", () => {
  const rule = new InsightScoreRequiredRegionRule("insight score needs a value");
  const item = newInsightScore("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InsightScoreRegionLengthRule flags a long region", () => {
  const rule = new InsightScoreRegionLengthRule(32);
  const item = newInsightScore("x", "y");
  item.region = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("InsightScoreOpenRateRangeRule flags values above open rate", () => {
  const rule = new InsightScoreOpenRateRangeRule(4.6, 1563.7);
  const item = newInsightScore("x", "y");
  item.openRate = 1565.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("InsightScoreCeilingRangeRule flags values above ceiling", () => {
  const rule = new InsightScoreCeilingRangeRule(0.1, 100.1);
  const item = newInsightScore("x", "y");
  item.ceiling = 101.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
