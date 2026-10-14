import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualStreakTargetLocaleLengthRule,
  ManualStreakTargetRequiredCodeRule,
  ManualStreakTargetStartsAtRangeRule,
  defaultManualStreakTargetValidator,
} from "./manual-streak-target-rules.js";
import { newManualStreakTarget } from "./manual-streak-target.js";

test("ManualStreakTargetValidator reports every problem", () => {
  const validator = defaultManualStreakTargetValidator();
  const item = newManualStreakTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualStreakTargetLocaleLengthRule flags a long locale", () => {
  const rule = new ManualStreakTargetLocaleLengthRule(16);
  const item = newManualStreakTarget("x", "y");
  item.locale = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualStreakTargetRequiredCodeRule flags a blank code", () => {
  const rule = new ManualStreakTargetRequiredCodeRule("manual streak target needs a value");
  const item = newManualStreakTarget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualStreakTargetStartsAtRangeRule flags values above starts at", () => {
  const rule = new ManualStreakTargetStartsAtRangeRule(32, 80);
  const item = newManualStreakTarget("x", "y");
  item.startsAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
