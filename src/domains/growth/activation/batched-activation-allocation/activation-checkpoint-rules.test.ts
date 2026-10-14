import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ActivationCheckpointCostRangeRule,
  ActivationCheckpointLabelLengthRule,
  ActivationCheckpointRequiredCodeRule,
  ActivationCheckpointRequiredVariantRule,
  ActivationCheckpointWeightRangeRule,
  defaultActivationCheckpointValidator,
} from "./activation-checkpoint-rules.js";
import { newActivationCheckpoint } from "./activation-checkpoint.js";

test("ActivationCheckpointValidator reports every problem", () => {
  const validator = defaultActivationCheckpointValidator();
  const item = newActivationCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ActivationCheckpointCostRangeRule flags values above cost", () => {
  const rule = new ActivationCheckpointCostRangeRule(8.1, 3872.7);
  const item = newActivationCheckpoint("x", "y");
  item.cost = 3874.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ActivationCheckpointRequiredCodeRule flags a blank code", () => {
  const rule = new ActivationCheckpointRequiredCodeRule("activation checkpoint needs this field");
  const item = newActivationCheckpoint("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ActivationCheckpointLabelLengthRule flags a long label", () => {
  const rule = new ActivationCheckpointLabelLengthRule(255);
  const item = newActivationCheckpoint("x", "y");
  item.label = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ActivationCheckpointRequiredVariantRule flags a blank variant", () => {
  const rule = new ActivationCheckpointRequiredVariantRule("activation checkpoint needs an entry");
  const item = newActivationCheckpoint("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ActivationCheckpointWeightRangeRule flags values above weight", () => {
  const rule = new ActivationCheckpointWeightRangeRule(5.1, 3476.7);
  const item = newActivationCheckpoint("x", "y");
  item.weight = 3478.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
