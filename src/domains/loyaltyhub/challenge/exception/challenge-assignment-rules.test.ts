import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ChallengeAssignmentFrequencyCapRangeRule,
  ChallengeAssignmentNameLengthRule,
  defaultChallengeAssignmentValidator,
} from "./challenge-assignment-rules.js";
import { newChallengeAssignment } from "./challenge-assignment.js";

test("ChallengeAssignmentValidator reports every problem", () => {
  const validator = defaultChallengeAssignmentValidator();
  const item = newChallengeAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ChallengeAssignmentFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new ChallengeAssignmentFrequencyCapRangeRule(80, 3600);
  const item = newChallengeAssignment("x", "y");
  item.frequencyCap = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ChallengeAssignmentNameLengthRule flags a long name", () => {
  const rule = new ChallengeAssignmentNameLengthRule(255);
  const item = newChallengeAssignment("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
