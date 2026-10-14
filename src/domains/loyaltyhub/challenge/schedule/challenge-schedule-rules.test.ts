import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ChallengeScheduleCodeLengthRule,
  ChallengeScheduleLabelLengthRule,
  ChallengeScheduleRequiredCodeRule,
  defaultChallengeScheduleValidator,
} from "./challenge-schedule-rules.js";
import { newChallengeSchedule } from "./challenge-schedule.js";

test("ChallengeScheduleValidator reports every problem", () => {
  const validator = defaultChallengeScheduleValidator();
  const item = newChallengeSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ChallengeScheduleCodeLengthRule flags a long code", () => {
  const rule = new ChallengeScheduleCodeLengthRule(80);
  const item = newChallengeSchedule("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ChallengeScheduleLabelLengthRule flags a long label", () => {
  const rule = new ChallengeScheduleLabelLengthRule(80);
  const item = newChallengeSchedule("x", "y");
  item.label = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ChallengeScheduleRequiredCodeRule flags a blank code", () => {
  const rule = new ChallengeScheduleRequiredCodeRule("challenge schedule needs this field");
  const item = newChallengeSchedule("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
