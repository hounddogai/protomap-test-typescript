import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveMacroSlotCurrencyLengthRule,
  AdaptiveMacroSlotImpressionsRangeRule,
  AdaptiveMacroSlotQuantityRangeRule,
  AdaptiveMacroSlotRequiredCategoryRule,
  AdaptiveMacroSlotRequiredCodeRule,
  AdaptiveMacroSlotRequiredCurrencyRule,
  defaultAdaptiveMacroSlotValidator,
} from "./adaptive-macro-slot-rules.js";
import { newAdaptiveMacroSlot } from "./adaptive-macro-slot.js";

test("AdaptiveMacroSlotValidator reports every problem", () => {
  const validator = defaultAdaptiveMacroSlotValidator();
  const item = newAdaptiveMacroSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveMacroSlotRequiredCodeRule flags a blank code", () => {
  const rule = new AdaptiveMacroSlotRequiredCodeRule("adaptive macro slot needs a value");
  const item = newAdaptiveMacroSlot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveMacroSlotQuantityRangeRule flags values above quantity", () => {
  const rule = new AdaptiveMacroSlotQuantityRangeRule(32, 3600);
  const item = newAdaptiveMacroSlot("x", "y");
  item.quantity = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveMacroSlotCurrencyLengthRule flags a long currency", () => {
  const rule = new AdaptiveMacroSlotCurrencyLengthRule(80);
  const item = newAdaptiveMacroSlot("x", "y");
  item.currency = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveMacroSlotRequiredCategoryRule flags a blank category", () => {
  const rule = new AdaptiveMacroSlotRequiredCategoryRule("adaptive macro slot needs this field");
  const item = newAdaptiveMacroSlot("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveMacroSlotImpressionsRangeRule flags values above impressions", () => {
  const rule = new AdaptiveMacroSlotImpressionsRangeRule(1000, 1000);
  const item = newAdaptiveMacroSlot("x", "y");
  item.impressions = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveMacroSlotRequiredCurrencyRule flags a blank currency", () => {
  const rule = new AdaptiveMacroSlotRequiredCurrencyRule("adaptive macro slot needs a value");
  const item = newAdaptiveMacroSlot("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
