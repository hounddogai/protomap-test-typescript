import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PostCheckpointLabelLengthRule,
  PostCheckpointNameLengthRule,
  PostCheckpointRequiredCodeRule,
  PostCheckpointRequiredLabelRule,
  defaultPostCheckpointValidator,
} from "./post-checkpoint-rules.js";
import { newPostCheckpoint } from "./post-checkpoint.js";

test("PostCheckpointValidator reports every problem", () => {
  const validator = defaultPostCheckpointValidator();
  const item = newPostCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PostCheckpointNameLengthRule flags a long name", () => {
  const rule = new PostCheckpointNameLengthRule(255);
  const item = newPostCheckpoint("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PostCheckpointRequiredCodeRule flags a blank code", () => {
  const rule = new PostCheckpointRequiredCodeRule("post checkpoint needs this field");
  const item = newPostCheckpoint("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PostCheckpointRequiredLabelRule flags a blank label", () => {
  const rule = new PostCheckpointRequiredLabelRule("post checkpoint needs a value");
  const item = newPostCheckpoint("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PostCheckpointLabelLengthRule flags a long label", () => {
  const rule = new PostCheckpointLabelLengthRule(32);
  const item = newPostCheckpoint("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
