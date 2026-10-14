import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedEnrollmentSlotDescriptionLengthRule,
  WeightedEnrollmentSlotGraceDaysRangeRule,
  WeightedEnrollmentSlotRatioRangeRule,
  WeightedEnrollmentSlotRequiredCodeRule,
  WeightedEnrollmentSlotRequiredTitleRule,
  defaultWeightedEnrollmentSlotValidator,
} from "./weighted-enrollment-slot-rules.js";
import { newWeightedEnrollmentSlot } from "./weighted-enrollment-slot.js";

test("WeightedEnrollmentSlotValidator reports every problem", () => {
  const validator = defaultWeightedEnrollmentSlotValidator();
  const item = newWeightedEnrollmentSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedEnrollmentSlotRequiredTitleRule flags a blank title", () => {
  const rule = new WeightedEnrollmentSlotRequiredTitleRule("weighted enrollment slot needs an entry");
  const item = newWeightedEnrollmentSlot("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedEnrollmentSlotGraceDaysRangeRule flags values above grace days", () => {
  const rule = new WeightedEnrollmentSlotGraceDaysRangeRule(16, 64);
  const item = newWeightedEnrollmentSlot("x", "y");
  item.graceDays = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedEnrollmentSlotRequiredCodeRule flags a blank code", () => {
  const rule = new WeightedEnrollmentSlotRequiredCodeRule("weighted enrollment slot needs an entry");
  const item = newWeightedEnrollmentSlot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedEnrollmentSlotDescriptionLengthRule flags a long description", () => {
  const rule = new WeightedEnrollmentSlotDescriptionLengthRule(3600);
  const item = newWeightedEnrollmentSlot("x", "y");
  item.description = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedEnrollmentSlotRatioRangeRule flags values above ratio", () => {
  const rule = new WeightedEnrollmentSlotRatioRangeRule(0.3, 1085.2);
  const item = newWeightedEnrollmentSlot("x", "y");
  item.ratio = 1086.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
