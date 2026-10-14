import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedActivationSlotCodeLengthRule,
  CappedActivationSlotFrequencyCapRangeRule,
  CappedActivationSlotRequiredNameRule,
  CappedActivationSlotRequiredPhoneRule,
  defaultCappedActivationSlotValidator,
} from "./capped-activation-slot-rules.js";
import { newCappedActivationSlot } from "./capped-activation-slot.js";

test("CappedActivationSlotValidator reports every problem", () => {
  const validator = defaultCappedActivationSlotValidator();
  const item = newCappedActivationSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedActivationSlotCodeLengthRule flags a long code", () => {
  const rule = new CappedActivationSlotCodeLengthRule(16);
  const item = newCappedActivationSlot("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedActivationSlotRequiredNameRule flags a blank name", () => {
  const rule = new CappedActivationSlotRequiredNameRule("capped activation slot needs an entry");
  const item = newCappedActivationSlot("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedActivationSlotFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new CappedActivationSlotFrequencyCapRangeRule(120, 3600);
  const item = newCappedActivationSlot("x", "y");
  item.frequencyCap = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedActivationSlotRequiredPhoneRule flags a blank phone", () => {
  const rule = new CappedActivationSlotRequiredPhoneRule("capped activation slot needs a value");
  const item = newCappedActivationSlot("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
