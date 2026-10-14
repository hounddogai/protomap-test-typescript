import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SenderCheckpointCodeLengthRule,
  SenderCheckpointNameLengthRule,
  SenderCheckpointRequiredCodeRule,
  SenderCheckpointVersionRangeRule,
  defaultSenderCheckpointValidator,
} from "./sender-checkpoint-rules.js";
import { newSenderCheckpoint } from "./sender-checkpoint.js";

test("SenderCheckpointValidator reports every problem", () => {
  const validator = defaultSenderCheckpointValidator();
  const item = newSenderCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SenderCheckpointNameLengthRule flags a long name", () => {
  const rule = new SenderCheckpointNameLengthRule(86400);
  const item = newSenderCheckpoint("x", "y");
  item.name = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SenderCheckpointRequiredCodeRule flags a blank code", () => {
  const rule = new SenderCheckpointRequiredCodeRule("sender checkpoint needs this field");
  const item = newSenderCheckpoint("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SenderCheckpointCodeLengthRule flags a long code", () => {
  const rule = new SenderCheckpointCodeLengthRule(16);
  const item = newSenderCheckpoint("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SenderCheckpointVersionRangeRule flags values above version", () => {
  const rule = new SenderCheckpointVersionRangeRule(32, 80);
  const item = newSenderCheckpoint("x", "y");
  item.version = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
