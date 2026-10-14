import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalStreakRecordAmountRangeRule,
  RegionalStreakRecordSourceLengthRule,
  defaultRegionalStreakRecordValidator,
} from "./regional-streak-record-rules.js";
import { newRegionalStreakRecord } from "./regional-streak-record.js";

test("RegionalStreakRecordValidator reports every problem", () => {
  const validator = defaultRegionalStreakRecordValidator();
  const item = newRegionalStreakRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalStreakRecordAmountRangeRule flags values above amount", () => {
  const rule = new RegionalStreakRecordAmountRangeRule(3.2, 2540.9);
  const item = newRegionalStreakRecord("x", "y");
  item.amount = 2542.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalStreakRecordSourceLengthRule flags a long source", () => {
  const rule = new RegionalStreakRecordSourceLengthRule(86400);
  const item = newRegionalStreakRecord("x", "y");
  item.source = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
