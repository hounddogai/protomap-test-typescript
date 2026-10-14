import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientFrequencyRecordCeilingRangeRule,
  LenientFrequencyRecordCreatedAtRangeRule,
  defaultLenientFrequencyRecordValidator,
} from "./lenient-frequency-record-rules.js";
import { newLenientFrequencyRecord } from "./lenient-frequency-record.js";

test("LenientFrequencyRecordValidator reports every problem", () => {
  const validator = defaultLenientFrequencyRecordValidator();
  const item = newLenientFrequencyRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientFrequencyRecordCreatedAtRangeRule flags values above created at", () => {
  const rule = new LenientFrequencyRecordCreatedAtRangeRule(32, 255);
  const item = newLenientFrequencyRecord("x", "y");
  item.createdAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientFrequencyRecordCeilingRangeRule flags values above ceiling", () => {
  const rule = new LenientFrequencyRecordCeilingRangeRule(1.5, 1728.2);
  const item = newLenientFrequencyRecord("x", "y");
  item.ceiling = 1729.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
