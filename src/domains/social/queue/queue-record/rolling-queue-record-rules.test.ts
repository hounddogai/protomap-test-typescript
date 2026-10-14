import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingQueueRecordJourneyIdLengthRule,
  RollingQueueRecordMinimumRangeRule,
  RollingQueueRecordRequiredCodeRule,
  RollingQueueRecordReviewerLengthRule,
  defaultRollingQueueRecordValidator,
} from "./rolling-queue-record-rules.js";
import { newRollingQueueRecord } from "./rolling-queue-record.js";

test("RollingQueueRecordValidator reports every problem", () => {
  const validator = defaultRollingQueueRecordValidator();
  const item = newRollingQueueRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingQueueRecordMinimumRangeRule flags values above minimum", () => {
  const rule = new RollingQueueRecordMinimumRangeRule(3.1, 2866.8);
  const item = newRollingQueueRecord("x", "y");
  item.minimum = 2868.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingQueueRecordReviewerLengthRule flags a long reviewer", () => {
  const rule = new RollingQueueRecordReviewerLengthRule(80);
  const item = newRollingQueueRecord("x", "y");
  item.reviewer = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingQueueRecordJourneyIdLengthRule flags a long journey id", () => {
  const rule = new RollingQueueRecordJourneyIdLengthRule(120);
  const item = newRollingQueueRecord("x", "y");
  item.journeyId = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingQueueRecordRequiredCodeRule flags a blank code", () => {
  const rule = new RollingQueueRecordRequiredCodeRule("rolling queue record needs a value");
  const item = newRollingQueueRecord("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
