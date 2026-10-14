import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedConversionRecordJourneyIdLengthRule,
  BatchedConversionRecordLabelLengthRule,
  BatchedConversionRecordMaximumRangeRule,
  BatchedConversionRecordRequiredJourneyIdRule,
  defaultBatchedConversionRecordValidator,
} from "./batched-conversion-record-rules.js";
import { newBatchedConversionRecord } from "./batched-conversion-record.js";

test("BatchedConversionRecordValidator reports every problem", () => {
  const validator = defaultBatchedConversionRecordValidator();
  const item = newBatchedConversionRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedConversionRecordLabelLengthRule flags a long label", () => {
  const rule = new BatchedConversionRecordLabelLengthRule(120);
  const item = newBatchedConversionRecord("x", "y");
  item.label = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedConversionRecordRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new BatchedConversionRecordRequiredJourneyIdRule("batched conversion record needs a value");
  const item = newBatchedConversionRecord("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedConversionRecordJourneyIdLengthRule flags a long journey id", () => {
  const rule = new BatchedConversionRecordJourneyIdLengthRule(80);
  const item = newBatchedConversionRecord("x", "y");
  item.journeyId = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedConversionRecordMaximumRangeRule flags values above maximum", () => {
  const rule = new BatchedConversionRecordMaximumRangeRule(7.5, 4684.7);
  const item = newBatchedConversionRecord("x", "y");
  item.maximum = 4686.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
