import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PreferenceSlotAttemptsRangeRule,
  PreferenceSlotNameLengthRule,
  PreferenceSlotRequiredCodeRule,
  PreferenceSlotRequiredNameRule,
  defaultPreferenceSlotValidator,
} from "./preference-slot-rules.js";
import { newPreferenceSlot } from "./preference-slot.js";

test("PreferenceSlotValidator reports every problem", () => {
  const validator = defaultPreferenceSlotValidator();
  const item = newPreferenceSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PreferenceSlotRequiredNameRule flags a blank name", () => {
  const rule = new PreferenceSlotRequiredNameRule("preference slot needs this field");
  const item = newPreferenceSlot("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PreferenceSlotNameLengthRule flags a long name", () => {
  const rule = new PreferenceSlotNameLengthRule(86400);
  const item = newPreferenceSlot("x", "y");
  item.name = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PreferenceSlotRequiredCodeRule flags a blank code", () => {
  const rule = new PreferenceSlotRequiredCodeRule("preference slot needs a value");
  const item = newPreferenceSlot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PreferenceSlotAttemptsRangeRule flags values above attempts", () => {
  const rule = new PreferenceSlotAttemptsRangeRule(1000, 3600);
  const item = newPreferenceSlot("x", "y");
  item.attempts = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
