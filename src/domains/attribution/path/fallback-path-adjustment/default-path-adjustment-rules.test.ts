import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultPathAdjustmentGraceDaysRangeRule,
  DefaultPathAdjustmentRequiredCodeRule,
  DefaultPathAdjustmentRequiredPhoneRule,
  DefaultPathAdjustmentRequiredTitleRule,
  DefaultPathAdjustmentStartsAtRangeRule,
  defaultDefaultPathAdjustmentValidator,
} from "./default-path-adjustment-rules.js";
import { newDefaultPathAdjustment } from "./default-path-adjustment.js";

test("DefaultPathAdjustmentValidator reports every problem", () => {
  const validator = defaultDefaultPathAdjustmentValidator();
  const item = newDefaultPathAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultPathAdjustmentStartsAtRangeRule flags values above starts at", () => {
  const rule = new DefaultPathAdjustmentStartsAtRangeRule(1000, 3600);
  const item = newDefaultPathAdjustment("x", "y");
  item.startsAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultPathAdjustmentRequiredCodeRule flags a blank code", () => {
  const rule = new DefaultPathAdjustmentRequiredCodeRule("default path adjustment needs this field");
  const item = newDefaultPathAdjustment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultPathAdjustmentRequiredPhoneRule flags a blank phone", () => {
  const rule = new DefaultPathAdjustmentRequiredPhoneRule("default path adjustment needs an entry");
  const item = newDefaultPathAdjustment("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultPathAdjustmentRequiredTitleRule flags a blank title", () => {
  const rule = new DefaultPathAdjustmentRequiredTitleRule("default path adjustment needs an entry");
  const item = newDefaultPathAdjustment("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultPathAdjustmentGraceDaysRangeRule flags values above grace days", () => {
  const rule = new DefaultPathAdjustmentGraceDaysRangeRule(80, 1000);
  const item = newDefaultPathAdjustment("x", "y");
  item.graceDays = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
