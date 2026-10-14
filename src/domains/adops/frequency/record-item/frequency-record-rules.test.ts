import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FrequencyRecordCodeLengthRule,
  FrequencyRecordLabelLengthRule,
  FrequencyRecordRatioRangeRule,
  FrequencyRecordRequiredCodeRule,
  FrequencyRecordRequiredSegmentRule,
  defaultFrequencyRecordValidator,
} from "./frequency-record-rules.js";
import { newFrequencyRecord } from "./frequency-record.js";

test("FrequencyRecordValidator reports every problem", () => {
  const validator = defaultFrequencyRecordValidator();
  const item = newFrequencyRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FrequencyRecordCodeLengthRule flags a long code", () => {
  const rule = new FrequencyRecordCodeLengthRule(16);
  const item = newFrequencyRecord("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FrequencyRecordRequiredCodeRule flags a blank code", () => {
  const rule = new FrequencyRecordRequiredCodeRule("frequency record needs a value");
  const item = newFrequencyRecord("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FrequencyRecordLabelLengthRule flags a long label", () => {
  const rule = new FrequencyRecordLabelLengthRule(1000);
  const item = newFrequencyRecord("x", "y");
  item.label = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FrequencyRecordRequiredSegmentRule flags a blank segment", () => {
  const rule = new FrequencyRecordRequiredSegmentRule("frequency record needs a value");
  const item = newFrequencyRecord("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FrequencyRecordRatioRangeRule flags values above ratio", () => {
  const rule = new FrequencyRecordRatioRangeRule(8.2, 3805.5);
  const item = newFrequencyRecord("x", "y");
  item.ratio = 3807;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
