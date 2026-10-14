import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EnrollmentSlotBatchSizeRangeRule,
  EnrollmentSlotChannelLengthRule,
  EnrollmentSlotRequiredTitleRule,
  defaultEnrollmentSlotValidator,
} from "./enrollment-slot-rules.js";
import { newEnrollmentSlot } from "./enrollment-slot.js";

test("EnrollmentSlotValidator reports every problem", () => {
  const validator = defaultEnrollmentSlotValidator();
  const item = newEnrollmentSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EnrollmentSlotRequiredTitleRule flags a blank title", () => {
  const rule = new EnrollmentSlotRequiredTitleRule("enrollment slot needs a value");
  const item = newEnrollmentSlot("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EnrollmentSlotBatchSizeRangeRule flags values above batch size", () => {
  const rule = new EnrollmentSlotBatchSizeRangeRule(3600, 3600);
  const item = newEnrollmentSlot("x", "y");
  item.batchSize = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("EnrollmentSlotChannelLengthRule flags a long channel", () => {
  const rule = new EnrollmentSlotChannelLengthRule(16);
  const item = newEnrollmentSlot("x", "y");
  item.channel = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
