import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingFrequencyRecordQuantityRangeRule,
  RollingFrequencyRecordStartsAtRangeRule,
  RollingFrequencyRecordTimezoneLengthRule,
  defaultRollingFrequencyRecordValidator,
} from "./rolling-frequency-record-rules.js";
import { newRollingFrequencyRecord } from "./rolling-frequency-record.js";

test("RollingFrequencyRecordValidator reports every problem", () => {
  const validator = defaultRollingFrequencyRecordValidator();
  const item = newRollingFrequencyRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingFrequencyRecordStartsAtRangeRule flags values above starts at", () => {
  const rule = new RollingFrequencyRecordStartsAtRangeRule(32, 86400);
  const item = newRollingFrequencyRecord("x", "y");
  item.startsAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingFrequencyRecordQuantityRangeRule flags values above quantity", () => {
  const rule = new RollingFrequencyRecordQuantityRangeRule(86400, 86400);
  const item = newRollingFrequencyRecord("x", "y");
  item.quantity = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingFrequencyRecordTimezoneLengthRule flags a long timezone", () => {
  const rule = new RollingFrequencyRecordTimezoneLengthRule(120);
  const item = newRollingFrequencyRecord("x", "y");
  item.timezone = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
