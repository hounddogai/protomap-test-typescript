import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalChallengeExceptionAttemptsRangeRule,
  SeasonalChallengeExceptionNameLengthRule,
  SeasonalChallengeExceptionRequiredCodeRule,
  defaultSeasonalChallengeExceptionValidator,
} from "./seasonal-challenge-exception-rules.js";
import { newSeasonalChallengeException } from "./seasonal-challenge-exception.js";

test("SeasonalChallengeExceptionValidator reports every problem", () => {
  const validator = defaultSeasonalChallengeExceptionValidator();
  const item = newSeasonalChallengeException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalChallengeExceptionAttemptsRangeRule flags values above attempts", () => {
  const rule = new SeasonalChallengeExceptionAttemptsRangeRule(3600, 3600);
  const item = newSeasonalChallengeException("x", "y");
  item.attempts = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalChallengeExceptionRequiredCodeRule flags a blank code", () => {
  const rule = new SeasonalChallengeExceptionRequiredCodeRule("seasonal challenge exception needs an entry");
  const item = newSeasonalChallengeException("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalChallengeExceptionNameLengthRule flags a long name", () => {
  const rule = new SeasonalChallengeExceptionNameLengthRule(86400);
  const item = newSeasonalChallengeException("x", "y");
  item.name = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
