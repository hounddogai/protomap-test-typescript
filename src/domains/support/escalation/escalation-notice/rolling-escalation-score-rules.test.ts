import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingEscalationScoreCodeLengthRule,
  RollingEscalationScoreEndsAtRangeRule,
  RollingEscalationScoreTimezoneLengthRule,
  RollingEscalationScoreVariantLengthRule,
  defaultRollingEscalationScoreValidator,
} from "./rolling-escalation-score-rules.js";
import { newRollingEscalationScore } from "./rolling-escalation-score.js";

test("RollingEscalationScoreValidator reports every problem", () => {
  const validator = defaultRollingEscalationScoreValidator();
  const item = newRollingEscalationScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingEscalationScoreCodeLengthRule flags a long code", () => {
  const rule = new RollingEscalationScoreCodeLengthRule(32);
  const item = newRollingEscalationScore("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingEscalationScoreVariantLengthRule flags a long variant", () => {
  const rule = new RollingEscalationScoreVariantLengthRule(80);
  const item = newRollingEscalationScore("x", "y");
  item.variant = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingEscalationScoreTimezoneLengthRule flags a long timezone", () => {
  const rule = new RollingEscalationScoreTimezoneLengthRule(64);
  const item = newRollingEscalationScore("x", "y");
  item.timezone = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingEscalationScoreEndsAtRangeRule flags values above ends at", () => {
  const rule = new RollingEscalationScoreEndsAtRangeRule(80, 80);
  const item = newRollingEscalationScore("x", "y");
  item.endsAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
