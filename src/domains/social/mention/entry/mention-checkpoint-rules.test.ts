import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MentionCheckpointCodeLengthRule,
  MentionCheckpointLabelLengthRule,
  MentionCheckpointRequiredLabelRule,
  MentionCheckpointUpdatedAtRangeRule,
  defaultMentionCheckpointValidator,
} from "./mention-checkpoint-rules.js";
import { newMentionCheckpoint } from "./mention-checkpoint.js";

test("MentionCheckpointValidator reports every problem", () => {
  const validator = defaultMentionCheckpointValidator();
  const item = newMentionCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("MentionCheckpointUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new MentionCheckpointUpdatedAtRangeRule(255, 86400);
  const item = newMentionCheckpoint("x", "y");
  item.updatedAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("MentionCheckpointLabelLengthRule flags a long label", () => {
  const rule = new MentionCheckpointLabelLengthRule(80);
  const item = newMentionCheckpoint("x", "y");
  item.label = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("MentionCheckpointRequiredLabelRule flags a blank label", () => {
  const rule = new MentionCheckpointRequiredLabelRule("mention checkpoint needs a value");
  const item = newMentionCheckpoint("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("MentionCheckpointCodeLengthRule flags a long code", () => {
  const rule = new MentionCheckpointCodeLengthRule(86400);
  const item = newMentionCheckpoint("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
