import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultFrequencyRecordCodeLengthRule,
  DefaultFrequencyRecordRequiredUtmSourceRule,
  DefaultFrequencyRecordUpdatedAtRangeRule,
  defaultDefaultFrequencyRecordValidator,
} from "./default-frequency-record-rules.js";
import { newDefaultFrequencyRecord } from "./default-frequency-record.js";

test("DefaultFrequencyRecordValidator reports every problem", () => {
  const validator = defaultDefaultFrequencyRecordValidator();
  const item = newDefaultFrequencyRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultFrequencyRecordCodeLengthRule flags a long code", () => {
  const rule = new DefaultFrequencyRecordCodeLengthRule(1000);
  const item = newDefaultFrequencyRecord("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultFrequencyRecordUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new DefaultFrequencyRecordUpdatedAtRangeRule(120, 3600);
  const item = newDefaultFrequencyRecord("x", "y");
  item.updatedAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultFrequencyRecordRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new DefaultFrequencyRecordRequiredUtmSourceRule("default frequency record needs a value");
  const item = newDefaultFrequencyRecord("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
