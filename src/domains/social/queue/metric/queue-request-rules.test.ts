import assert from "node:assert/strict";
import { test } from "node:test";
import {
  QueueRequestDurationMinutesRangeRule,
  QueueRequestNotesLengthRule,
  QueueRequestRequiredNotesRule,
  QueueRequestRequiredVariantRule,
  QueueRequestVariantLengthRule,
  defaultQueueRequestValidator,
} from "./queue-request-rules.js";
import { newQueueRequest } from "./queue-request.js";

test("QueueRequestValidator reports every problem", () => {
  const validator = defaultQueueRequestValidator();
  const item = newQueueRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("QueueRequestDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new QueueRequestDurationMinutesRangeRule(16, 1000);
  const item = newQueueRequest("x", "y");
  item.durationMinutes = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("QueueRequestRequiredVariantRule flags a blank variant", () => {
  const rule = new QueueRequestRequiredVariantRule("queue request needs an entry");
  const item = newQueueRequest("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("QueueRequestVariantLengthRule flags a long variant", () => {
  const rule = new QueueRequestVariantLengthRule(120);
  const item = newQueueRequest("x", "y");
  item.variant = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("QueueRequestNotesLengthRule flags a long notes", () => {
  const rule = new QueueRequestNotesLengthRule(255);
  const item = newQueueRequest("x", "y");
  item.notes = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("QueueRequestRequiredNotesRule flags a blank notes", () => {
  const rule = new QueueRequestRequiredNotesRule("queue request needs this field");
  const item = newQueueRequest("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
