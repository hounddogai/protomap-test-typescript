import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualStreakExceptionCodeLengthRule,
  ManualStreakExceptionCostRangeRule,
  ManualStreakExceptionDurationMinutesRangeRule,
  ManualStreakExceptionRatioRangeRule,
  defaultManualStreakExceptionValidator,
} from "./manual-streak-exception-rules.js";
import { newManualStreakException } from "./manual-streak-exception.js";

test("ManualStreakExceptionValidator reports every problem", () => {
  const validator = defaultManualStreakExceptionValidator();
  const item = newManualStreakException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualStreakExceptionRatioRangeRule flags values above ratio", () => {
  const rule = new ManualStreakExceptionRatioRangeRule(0.3, 2069.4);
  const item = newManualStreakException("x", "y");
  item.ratio = 2070.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualStreakExceptionDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new ManualStreakExceptionDurationMinutesRangeRule(64, 255);
  const item = newManualStreakException("x", "y");
  item.durationMinutes = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualStreakExceptionCodeLengthRule flags a long code", () => {
  const rule = new ManualStreakExceptionCodeLengthRule(64);
  const item = newManualStreakException("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualStreakExceptionCostRangeRule flags values above cost", () => {
  const rule = new ManualStreakExceptionCostRangeRule(2.5, 1256.5);
  const item = newManualStreakException("x", "y");
  item.cost = 1258;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
