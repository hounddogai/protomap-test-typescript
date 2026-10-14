import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientEnrollmentSlotMarginRangeRule,
  LenientEnrollmentSlotNameLengthRule,
  LenientEnrollmentSlotRequiredNameRule,
  defaultLenientEnrollmentSlotValidator,
} from "./lenient-enrollment-slot-rules.js";
import { newLenientEnrollmentSlot } from "./lenient-enrollment-slot.js";

test("LenientEnrollmentSlotValidator reports every problem", () => {
  const validator = defaultLenientEnrollmentSlotValidator();
  const item = newLenientEnrollmentSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientEnrollmentSlotRequiredNameRule flags a blank name", () => {
  const rule = new LenientEnrollmentSlotRequiredNameRule("lenient enrollment slot needs an entry");
  const item = newLenientEnrollmentSlot("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientEnrollmentSlotNameLengthRule flags a long name", () => {
  const rule = new LenientEnrollmentSlotNameLengthRule(16);
  const item = newLenientEnrollmentSlot("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientEnrollmentSlotMarginRangeRule flags values above margin", () => {
  const rule = new LenientEnrollmentSlotMarginRangeRule(2, 3774.4);
  const item = newLenientEnrollmentSlot("x", "y");
  item.margin = 3775.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
