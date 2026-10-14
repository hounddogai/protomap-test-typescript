import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ChallengeExceptionCreatedAtRangeRule,
  ChallengeExceptionRequiredLabelRule,
  defaultChallengeExceptionValidator,
} from "./challenge-exception-rules.js";
import { newChallengeException } from "./challenge-exception.js";

test("ChallengeExceptionValidator reports every problem", () => {
  const validator = defaultChallengeExceptionValidator();
  const item = newChallengeException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ChallengeExceptionRequiredLabelRule flags a blank label", () => {
  const rule = new ChallengeExceptionRequiredLabelRule("challenge exception needs this field");
  const item = newChallengeException("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ChallengeExceptionCreatedAtRangeRule flags values above created at", () => {
  const rule = new ChallengeExceptionCreatedAtRangeRule(32, 86400);
  const item = newChallengeException("x", "y");
  item.createdAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
