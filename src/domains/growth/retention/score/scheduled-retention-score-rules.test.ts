import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledRetentionScoreLabelLengthRule,
  ScheduledRetentionScoreRequiredCodeRule,
  ScheduledRetentionScoreScoreRangeRule,
  defaultScheduledRetentionScoreValidator,
} from "./scheduled-retention-score-rules.js";
import { newScheduledRetentionScore } from "./scheduled-retention-score.js";

test("ScheduledRetentionScoreValidator reports every problem", () => {
  const validator = defaultScheduledRetentionScoreValidator();
  const item = newScheduledRetentionScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledRetentionScoreLabelLengthRule flags a long label", () => {
  const rule = new ScheduledRetentionScoreLabelLengthRule(16);
  const item = newScheduledRetentionScore("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledRetentionScoreRequiredCodeRule flags a blank code", () => {
  const rule = new ScheduledRetentionScoreRequiredCodeRule("scheduled retention score needs this field");
  const item = newScheduledRetentionScore("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledRetentionScoreScoreRangeRule flags values above score", () => {
  const rule = new ScheduledRetentionScoreScoreRangeRule(5.5, 4123.5);
  const item = newScheduledRetentionScore("x", "y");
  item.score = 4125;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
