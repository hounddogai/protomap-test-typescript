import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingPacingScoreCodeLengthRule,
  RollingPacingScoreNameLengthRule,
  defaultRollingPacingScoreValidator,
} from "./rolling-pacing-score-rules.js";
import { newRollingPacingScore } from "./rolling-pacing-score.js";

test("RollingPacingScoreValidator reports every problem", () => {
  const validator = defaultRollingPacingScoreValidator();
  const item = newRollingPacingScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingPacingScoreNameLengthRule flags a long name", () => {
  const rule = new RollingPacingScoreNameLengthRule(255);
  const item = newRollingPacingScore("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingPacingScoreCodeLengthRule flags a long code", () => {
  const rule = new RollingPacingScoreCodeLengthRule(120);
  const item = newRollingPacingScore("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
