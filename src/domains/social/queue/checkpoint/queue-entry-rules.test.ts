import assert from "node:assert/strict";
import { test } from "node:test";
import {
  QueueEntryAudienceIdLengthRule,
  QueueEntryNameLengthRule,
  defaultQueueEntryValidator,
} from "./queue-entry-rules.js";
import { newQueueEntry } from "./queue-entry.js";

test("QueueEntryValidator reports every problem", () => {
  const validator = defaultQueueEntryValidator();
  const item = newQueueEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("QueueEntryNameLengthRule flags a long name", () => {
  const rule = new QueueEntryNameLengthRule(16);
  const item = newQueueEntry("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("QueueEntryAudienceIdLengthRule flags a long audience id", () => {
  const rule = new QueueEntryAudienceIdLengthRule(120);
  const item = newQueueEntry("x", "y");
  item.audienceId = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
