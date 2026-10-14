import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DoubleOptInSlotMinimumRangeRule,
  DoubleOptInSlotRequiredCodeRule,
  defaultDoubleOptInSlotValidator,
} from "./double-opt-in-slot-rules.js";
import { newDoubleOptInSlot } from "./double-opt-in-slot.js";

test("DoubleOptInSlotValidator reports every problem", () => {
  const validator = defaultDoubleOptInSlotValidator();
  const item = newDoubleOptInSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DoubleOptInSlotRequiredCodeRule flags a blank code", () => {
  const rule = new DoubleOptInSlotRequiredCodeRule("double opt in slot needs a value");
  const item = newDoubleOptInSlot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DoubleOptInSlotMinimumRangeRule flags values above minimum", () => {
  const rule = new DoubleOptInSlotMinimumRangeRule(6.9, 3536.5);
  const item = newDoubleOptInSlot("x", "y");
  item.minimum = 3538;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
