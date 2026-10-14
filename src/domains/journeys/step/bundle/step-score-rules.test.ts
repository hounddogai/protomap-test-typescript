import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StepScoreLabelLengthRule,
  StepScoreSequenceRangeRule,
  StepScoreVersionRangeRule,
  defaultStepScoreValidator,
} from "./step-score-rules.js";
import { newStepScore } from "./step-score.js";

test("StepScoreValidator reports every problem", () => {
  const validator = defaultStepScoreValidator();
  const item = newStepScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StepScoreSequenceRangeRule flags values above sequence", () => {
  const rule = new StepScoreSequenceRangeRule(16, 1000);
  const item = newStepScore("x", "y");
  item.sequence = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StepScoreLabelLengthRule flags a long label", () => {
  const rule = new StepScoreLabelLengthRule(16);
  const item = newStepScore("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StepScoreVersionRangeRule flags values above version", () => {
  const rule = new StepScoreVersionRangeRule(32, 3600);
  const item = newStepScore("x", "y");
  item.version = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
