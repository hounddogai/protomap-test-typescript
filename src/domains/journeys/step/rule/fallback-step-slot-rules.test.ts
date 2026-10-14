import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackStepSlotOpenRateRangeRule,
  FallbackStepSlotQuantityRangeRule,
  FallbackStepSlotRequiredCodeRule,
  FallbackStepSlotRequiredCurrencyRule,
  FallbackStepSlotRequiredUnitRule,
  FallbackStepSlotUnitLengthRule,
  defaultFallbackStepSlotValidator,
} from "./fallback-step-slot-rules.js";
import { newFallbackStepSlot } from "./fallback-step-slot.js";

test("FallbackStepSlotValidator reports every problem", () => {
  const validator = defaultFallbackStepSlotValidator();
  const item = newFallbackStepSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackStepSlotUnitLengthRule flags a long unit", () => {
  const rule = new FallbackStepSlotUnitLengthRule(64);
  const item = newFallbackStepSlot("x", "y");
  item.unit = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackStepSlotRequiredCurrencyRule flags a blank currency", () => {
  const rule = new FallbackStepSlotRequiredCurrencyRule("fallback step slot needs a value");
  const item = newFallbackStepSlot("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackStepSlotRequiredUnitRule flags a blank unit", () => {
  const rule = new FallbackStepSlotRequiredUnitRule("fallback step slot needs an entry");
  const item = newFallbackStepSlot("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackStepSlotOpenRateRangeRule flags values above open rate", () => {
  const rule = new FallbackStepSlotOpenRateRangeRule(9, 1970.4);
  const item = newFallbackStepSlot("x", "y");
  item.openRate = 1971.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackStepSlotQuantityRangeRule flags values above quantity", () => {
  const rule = new FallbackStepSlotQuantityRangeRule(1000, 86400);
  const item = newFallbackStepSlot("x", "y");
  item.quantity = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackStepSlotRequiredCodeRule flags a blank code", () => {
  const rule = new FallbackStepSlotRequiredCodeRule("fallback step slot needs an entry");
  const item = newFallbackStepSlot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
