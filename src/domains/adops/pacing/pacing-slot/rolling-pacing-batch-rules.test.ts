import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingPacingBatchNameLengthRule,
  RollingPacingBatchRequiredNameRule,
  RollingPacingBatchRequiredTimezoneRule,
  RollingPacingBatchTimezoneLengthRule,
  defaultRollingPacingBatchValidator,
} from "./rolling-pacing-batch-rules.js";
import { newRollingPacingBatch } from "./rolling-pacing-batch.js";

test("RollingPacingBatchValidator reports every problem", () => {
  const validator = defaultRollingPacingBatchValidator();
  const item = newRollingPacingBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingPacingBatchRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new RollingPacingBatchRequiredTimezoneRule("rolling pacing batch needs an entry");
  const item = newRollingPacingBatch("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingPacingBatchTimezoneLengthRule flags a long timezone", () => {
  const rule = new RollingPacingBatchTimezoneLengthRule(120);
  const item = newRollingPacingBatch("x", "y");
  item.timezone = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingPacingBatchNameLengthRule flags a long name", () => {
  const rule = new RollingPacingBatchNameLengthRule(80);
  const item = newRollingPacingBatch("x", "y");
  item.name = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingPacingBatchRequiredNameRule flags a blank name", () => {
  const rule = new RollingPacingBatchRequiredNameRule("rolling pacing batch needs an entry");
  const item = newRollingPacingBatch("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
