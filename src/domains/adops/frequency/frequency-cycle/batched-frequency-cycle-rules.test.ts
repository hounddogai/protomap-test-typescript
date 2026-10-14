import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedFrequencyCycleClicksRangeRule,
  BatchedFrequencyCycleRequiredCodeRule,
  BatchedFrequencyCycleRevisionRangeRule,
  defaultBatchedFrequencyCycleValidator,
} from "./batched-frequency-cycle-rules.js";
import { newBatchedFrequencyCycle } from "./batched-frequency-cycle.js";

test("BatchedFrequencyCycleValidator reports every problem", () => {
  const validator = defaultBatchedFrequencyCycleValidator();
  const item = newBatchedFrequencyCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedFrequencyCycleClicksRangeRule flags values above clicks", () => {
  const rule = new BatchedFrequencyCycleClicksRangeRule(64, 64);
  const item = newBatchedFrequencyCycle("x", "y");
  item.clicks = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedFrequencyCycleRequiredCodeRule flags a blank code", () => {
  const rule = new BatchedFrequencyCycleRequiredCodeRule("batched frequency cycle needs a value");
  const item = newBatchedFrequencyCycle("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedFrequencyCycleRevisionRangeRule flags values above revision", () => {
  const rule = new BatchedFrequencyCycleRevisionRangeRule(32, 80);
  const item = newBatchedFrequencyCycle("x", "y");
  item.revision = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
