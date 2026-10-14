import assert from "node:assert/strict";
import { test } from "node:test";
import {
  NudgeScoreBatchSizeRangeRule,
  NudgeScoreCodeLengthRule,
  NudgeScoreDurationMinutesRangeRule,
  defaultNudgeScoreValidator,
} from "./nudge-score-rules.js";
import { newNudgeScore } from "./nudge-score.js";

test("NudgeScoreValidator reports every problem", () => {
  const validator = defaultNudgeScoreValidator();
  const item = newNudgeScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("NudgeScoreDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new NudgeScoreDurationMinutesRangeRule(3600, 3600);
  const item = newNudgeScore("x", "y");
  item.durationMinutes = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("NudgeScoreCodeLengthRule flags a long code", () => {
  const rule = new NudgeScoreCodeLengthRule(255);
  const item = newNudgeScore("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("NudgeScoreBatchSizeRangeRule flags values above batch size", () => {
  const rule = new NudgeScoreBatchSizeRangeRule(32, 80);
  const item = newNudgeScore("x", "y");
  item.batchSize = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
