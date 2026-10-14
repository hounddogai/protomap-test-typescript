import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WarmupCheckpointCodeLengthRule,
  WarmupCheckpointLabelLengthRule,
  WarmupCheckpointRequiredVariantRule,
  defaultWarmupCheckpointValidator,
} from "./warmup-checkpoint-rules.js";
import { newWarmupCheckpoint } from "./warmup-checkpoint.js";

test("WarmupCheckpointValidator reports every problem", () => {
  const validator = defaultWarmupCheckpointValidator();
  const item = newWarmupCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WarmupCheckpointRequiredVariantRule flags a blank variant", () => {
  const rule = new WarmupCheckpointRequiredVariantRule("warmup checkpoint needs an entry");
  const item = newWarmupCheckpoint("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WarmupCheckpointLabelLengthRule flags a long label", () => {
  const rule = new WarmupCheckpointLabelLengthRule(3600);
  const item = newWarmupCheckpoint("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WarmupCheckpointCodeLengthRule flags a long code", () => {
  const rule = new WarmupCheckpointCodeLengthRule(3600);
  const item = newWarmupCheckpoint("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
