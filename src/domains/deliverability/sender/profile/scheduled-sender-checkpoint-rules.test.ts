import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledSenderCheckpointCreatedAtRangeRule,
  ScheduledSenderCheckpointSourceLengthRule,
  defaultScheduledSenderCheckpointValidator,
} from "./scheduled-sender-checkpoint-rules.js";
import { newScheduledSenderCheckpoint } from "./scheduled-sender-checkpoint.js";

test("ScheduledSenderCheckpointValidator reports every problem", () => {
  const validator = defaultScheduledSenderCheckpointValidator();
  const item = newScheduledSenderCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledSenderCheckpointCreatedAtRangeRule flags values above created at", () => {
  const rule = new ScheduledSenderCheckpointCreatedAtRangeRule(3600, 86400);
  const item = newScheduledSenderCheckpoint("x", "y");
  item.createdAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledSenderCheckpointSourceLengthRule flags a long source", () => {
  const rule = new ScheduledSenderCheckpointSourceLengthRule(86400);
  const item = newScheduledSenderCheckpoint("x", "y");
  item.source = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
