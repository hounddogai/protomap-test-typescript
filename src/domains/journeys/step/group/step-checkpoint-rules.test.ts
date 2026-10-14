import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StepCheckpointCostRangeRule,
  StepCheckpointLabelLengthRule,
  StepCheckpointRequiredCodeRule,
  StepCheckpointRevisionRangeRule,
  defaultStepCheckpointValidator,
} from "./step-checkpoint-rules.js";
import { newStepCheckpoint } from "./step-checkpoint.js";

test("StepCheckpointValidator reports every problem", () => {
  const validator = defaultStepCheckpointValidator();
  const item = newStepCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StepCheckpointRevisionRangeRule flags values above revision", () => {
  const rule = new StepCheckpointRevisionRangeRule(16, 64);
  const item = newStepCheckpoint("x", "y");
  item.revision = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StepCheckpointRequiredCodeRule flags a blank code", () => {
  const rule = new StepCheckpointRequiredCodeRule("step checkpoint needs a value");
  const item = newStepCheckpoint("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StepCheckpointCostRangeRule flags values above cost", () => {
  const rule = new StepCheckpointCostRangeRule(6.3, 1854.6);
  const item = newStepCheckpoint("x", "y");
  item.cost = 1856.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StepCheckpointLabelLengthRule flags a long label", () => {
  const rule = new StepCheckpointLabelLengthRule(32);
  const item = newStepCheckpoint("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
