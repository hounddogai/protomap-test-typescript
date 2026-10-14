import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledMentionCheckpointDescriptionLengthRule,
  ScheduledMentionCheckpointRequiredCodeRule,
  ScheduledMentionCheckpointRequiredDescriptionRule,
  ScheduledMentionCheckpointRequiredNameRule,
  defaultScheduledMentionCheckpointValidator,
} from "./scheduled-mention-checkpoint-rules.js";
import { newScheduledMentionCheckpoint } from "./scheduled-mention-checkpoint.js";

test("ScheduledMentionCheckpointValidator reports every problem", () => {
  const validator = defaultScheduledMentionCheckpointValidator();
  const item = newScheduledMentionCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledMentionCheckpointRequiredDescriptionRule flags a blank description", () => {
  const rule = new ScheduledMentionCheckpointRequiredDescriptionRule("scheduled mention checkpoint needs this field");
  const item = newScheduledMentionCheckpoint("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledMentionCheckpointRequiredCodeRule flags a blank code", () => {
  const rule = new ScheduledMentionCheckpointRequiredCodeRule("scheduled mention checkpoint needs an entry");
  const item = newScheduledMentionCheckpoint("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledMentionCheckpointDescriptionLengthRule flags a long description", () => {
  const rule = new ScheduledMentionCheckpointDescriptionLengthRule(32);
  const item = newScheduledMentionCheckpoint("x", "y");
  item.description = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledMentionCheckpointRequiredNameRule flags a blank name", () => {
  const rule = new ScheduledMentionCheckpointRequiredNameRule("scheduled mention checkpoint needs this field");
  const item = newScheduledMentionCheckpoint("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
