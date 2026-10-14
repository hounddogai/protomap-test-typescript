import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalOptOutSlotNameLengthRule,
  GlobalOptOutSlotRequiredCodeRule,
  GlobalOptOutSlotRequiredNameRule,
  GlobalOptOutSlotSourceLengthRule,
  GlobalOptOutSlotWindowDaysRangeRule,
  defaultGlobalOptOutSlotValidator,
} from "./global-opt-out-slot-rules.js";
import { newGlobalOptOutSlot } from "./global-opt-out-slot.js";

test("GlobalOptOutSlotValidator reports every problem", () => {
  const validator = defaultGlobalOptOutSlotValidator();
  const item = newGlobalOptOutSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalOptOutSlotSourceLengthRule flags a long source", () => {
  const rule = new GlobalOptOutSlotSourceLengthRule(3600);
  const item = newGlobalOptOutSlot("x", "y");
  item.source = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalOptOutSlotWindowDaysRangeRule flags values above window days", () => {
  const rule = new GlobalOptOutSlotWindowDaysRangeRule(3600, 86400);
  const item = newGlobalOptOutSlot("x", "y");
  item.windowDays = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalOptOutSlotNameLengthRule flags a long name", () => {
  const rule = new GlobalOptOutSlotNameLengthRule(16);
  const item = newGlobalOptOutSlot("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalOptOutSlotRequiredCodeRule flags a blank code", () => {
  const rule = new GlobalOptOutSlotRequiredCodeRule("global opt out slot needs this field");
  const item = newGlobalOptOutSlot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalOptOutSlotRequiredNameRule flags a blank name", () => {
  const rule = new GlobalOptOutSlotRequiredNameRule("global opt out slot needs an entry");
  const item = newGlobalOptOutSlot("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
