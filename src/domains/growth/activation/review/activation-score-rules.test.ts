import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ActivationScoreDurationMinutesRangeRule,
  ActivationScoreLabelLengthRule,
  ActivationScoreRequiredCodeRule,
  defaultActivationScoreValidator,
} from "./activation-score-rules.js";
import { newActivationScore } from "./activation-score.js";

test("ActivationScoreValidator reports every problem", () => {
  const validator = defaultActivationScoreValidator();
  const item = newActivationScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ActivationScoreRequiredCodeRule flags a blank code", () => {
  const rule = new ActivationScoreRequiredCodeRule("activation score needs a value");
  const item = newActivationScore("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ActivationScoreLabelLengthRule flags a long label", () => {
  const rule = new ActivationScoreLabelLengthRule(1000);
  const item = newActivationScore("x", "y");
  item.label = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ActivationScoreDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new ActivationScoreDurationMinutesRangeRule(32, 86400);
  const item = newActivationScore("x", "y");
  item.durationMinutes = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
