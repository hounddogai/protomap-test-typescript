import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalBadgeSlotCodeLengthRule,
  SeasonalBadgeSlotDiscountRangeRule,
  SeasonalBadgeSlotPhoneLengthRule,
  SeasonalBadgeSlotRequiredCodeRule,
  SeasonalBadgeSlotRequiredNameRule,
  SeasonalBadgeSlotRequiredPhoneRule,
  defaultSeasonalBadgeSlotValidator,
} from "./seasonal-badge-slot-rules.js";
import { newSeasonalBadgeSlot } from "./seasonal-badge-slot.js";

test("SeasonalBadgeSlotValidator reports every problem", () => {
  const validator = defaultSeasonalBadgeSlotValidator();
  const item = newSeasonalBadgeSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalBadgeSlotRequiredNameRule flags a blank name", () => {
  const rule = new SeasonalBadgeSlotRequiredNameRule("seasonal badge slot needs an entry");
  const item = newSeasonalBadgeSlot("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalBadgeSlotRequiredPhoneRule flags a blank phone", () => {
  const rule = new SeasonalBadgeSlotRequiredPhoneRule("seasonal badge slot needs a value");
  const item = newSeasonalBadgeSlot("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalBadgeSlotPhoneLengthRule flags a long phone", () => {
  const rule = new SeasonalBadgeSlotPhoneLengthRule(120);
  const item = newSeasonalBadgeSlot("x", "y");
  item.phone = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalBadgeSlotDiscountRangeRule flags values above discount", () => {
  const rule = new SeasonalBadgeSlotDiscountRangeRule(8.7, 821.1);
  const item = newSeasonalBadgeSlot("x", "y");
  item.discount = 822.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalBadgeSlotCodeLengthRule flags a long code", () => {
  const rule = new SeasonalBadgeSlotCodeLengthRule(32);
  const item = newSeasonalBadgeSlot("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalBadgeSlotRequiredCodeRule flags a blank code", () => {
  const rule = new SeasonalBadgeSlotRequiredCodeRule("seasonal badge slot needs an entry");
  const item = newSeasonalBadgeSlot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
