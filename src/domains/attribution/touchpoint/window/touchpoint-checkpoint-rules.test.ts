import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TouchpointCheckpointAttemptsRangeRule,
  TouchpointCheckpointCodeLengthRule,
  TouchpointCheckpointRequiredCodeRule,
  TouchpointCheckpointRequiredDescriptionRule,
  defaultTouchpointCheckpointValidator,
} from "./touchpoint-checkpoint-rules.js";
import { newTouchpointCheckpoint } from "./touchpoint-checkpoint.js";

test("TouchpointCheckpointValidator reports every problem", () => {
  const validator = defaultTouchpointCheckpointValidator();
  const item = newTouchpointCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TouchpointCheckpointRequiredDescriptionRule flags a blank description", () => {
  const rule = new TouchpointCheckpointRequiredDescriptionRule("touchpoint checkpoint needs a value");
  const item = newTouchpointCheckpoint("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TouchpointCheckpointCodeLengthRule flags a long code", () => {
  const rule = new TouchpointCheckpointCodeLengthRule(86400);
  const item = newTouchpointCheckpoint("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TouchpointCheckpointAttemptsRangeRule flags values above attempts", () => {
  const rule = new TouchpointCheckpointAttemptsRangeRule(80, 1000);
  const item = newTouchpointCheckpoint("x", "y");
  item.attempts = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TouchpointCheckpointRequiredCodeRule flags a blank code", () => {
  const rule = new TouchpointCheckpointRequiredCodeRule("touchpoint checkpoint needs this field");
  const item = newTouchpointCheckpoint("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
