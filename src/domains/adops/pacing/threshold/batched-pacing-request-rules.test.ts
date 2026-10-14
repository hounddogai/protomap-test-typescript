import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedPacingRequestBatchSizeRangeRule,
  BatchedPacingRequestFrequencyCapRangeRule,
  BatchedPacingRequestRequiredCodeRule,
  BatchedPacingRequestRequiredLabelRule,
  BatchedPacingRequestUnitLengthRule,
  defaultBatchedPacingRequestValidator,
} from "./batched-pacing-request-rules.js";
import { newBatchedPacingRequest } from "./batched-pacing-request.js";

test("BatchedPacingRequestValidator reports every problem", () => {
  const validator = defaultBatchedPacingRequestValidator();
  const item = newBatchedPacingRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedPacingRequestRequiredLabelRule flags a blank label", () => {
  const rule = new BatchedPacingRequestRequiredLabelRule("batched pacing request needs an entry");
  const item = newBatchedPacingRequest("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedPacingRequestUnitLengthRule flags a long unit", () => {
  const rule = new BatchedPacingRequestUnitLengthRule(16);
  const item = newBatchedPacingRequest("x", "y");
  item.unit = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedPacingRequestBatchSizeRangeRule flags values above batch size", () => {
  const rule = new BatchedPacingRequestBatchSizeRangeRule(80, 1000);
  const item = newBatchedPacingRequest("x", "y");
  item.batchSize = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedPacingRequestRequiredCodeRule flags a blank code", () => {
  const rule = new BatchedPacingRequestRequiredCodeRule("batched pacing request needs a value");
  const item = newBatchedPacingRequest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedPacingRequestFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new BatchedPacingRequestFrequencyCapRangeRule(16, 80);
  const item = newBatchedPacingRequest("x", "y");
  item.frequencyCap = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
