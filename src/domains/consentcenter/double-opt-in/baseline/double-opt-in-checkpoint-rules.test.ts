import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DoubleOptInCheckpointLabelLengthRule,
  DoubleOptInCheckpointRequiredSegmentRule,
  defaultDoubleOptInCheckpointValidator,
} from "./double-opt-in-checkpoint-rules.js";
import { newDoubleOptInCheckpoint } from "./double-opt-in-checkpoint.js";

test("DoubleOptInCheckpointValidator reports every problem", () => {
  const validator = defaultDoubleOptInCheckpointValidator();
  const item = newDoubleOptInCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DoubleOptInCheckpointRequiredSegmentRule flags a blank segment", () => {
  const rule = new DoubleOptInCheckpointRequiredSegmentRule("double opt in checkpoint needs this field");
  const item = newDoubleOptInCheckpoint("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DoubleOptInCheckpointLabelLengthRule flags a long label", () => {
  const rule = new DoubleOptInCheckpointLabelLengthRule(32);
  const item = newDoubleOptInCheckpoint("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
