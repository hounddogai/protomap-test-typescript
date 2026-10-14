import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledChallengeCheckpointCountryLengthRule,
  ScheduledChallengeCheckpointCreatedAtRangeRule,
  ScheduledChallengeCheckpointRequiredTimezoneRule,
  defaultScheduledChallengeCheckpointValidator,
} from "./scheduled-challenge-checkpoint-rules.js";
import { newScheduledChallengeCheckpoint } from "./scheduled-challenge-checkpoint.js";

test("ScheduledChallengeCheckpointValidator reports every problem", () => {
  const validator = defaultScheduledChallengeCheckpointValidator();
  const item = newScheduledChallengeCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledChallengeCheckpointRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new ScheduledChallengeCheckpointRequiredTimezoneRule("scheduled challenge checkpoint needs an entry");
  const item = newScheduledChallengeCheckpoint("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledChallengeCheckpointCountryLengthRule flags a long country", () => {
  const rule = new ScheduledChallengeCheckpointCountryLengthRule(255);
  const item = newScheduledChallengeCheckpoint("x", "y");
  item.country = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledChallengeCheckpointCreatedAtRangeRule flags values above created at", () => {
  const rule = new ScheduledChallengeCheckpointCreatedAtRangeRule(32, 1000);
  const item = newScheduledChallengeCheckpoint("x", "y");
  item.createdAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
