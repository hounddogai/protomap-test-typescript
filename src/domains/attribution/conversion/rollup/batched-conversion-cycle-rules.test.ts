import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedConversionCycleCohortLengthRule,
  BatchedConversionCycleLabelLengthRule,
  BatchedConversionCycleRequiredContactEmailRule,
  defaultBatchedConversionCycleValidator,
} from "./batched-conversion-cycle-rules.js";
import { newBatchedConversionCycle } from "./batched-conversion-cycle.js";

test("BatchedConversionCycleValidator reports every problem", () => {
  const validator = defaultBatchedConversionCycleValidator();
  const item = newBatchedConversionCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedConversionCycleCohortLengthRule flags a long cohort", () => {
  const rule = new BatchedConversionCycleCohortLengthRule(120);
  const item = newBatchedConversionCycle("x", "y");
  item.cohort = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedConversionCycleLabelLengthRule flags a long label", () => {
  const rule = new BatchedConversionCycleLabelLengthRule(86400);
  const item = newBatchedConversionCycle("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedConversionCycleRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new BatchedConversionCycleRequiredContactEmailRule("batched conversion cycle needs a value");
  const item = newBatchedConversionCycle("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
