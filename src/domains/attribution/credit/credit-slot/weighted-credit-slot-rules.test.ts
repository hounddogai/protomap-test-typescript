import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedCreditSlotConversionRateRangeRule,
  WeightedCreditSlotFrequencyCapRangeRule,
  WeightedCreditSlotNameLengthRule,
  WeightedCreditSlotRequiredCodeRule,
  WeightedCreditSlotRequiredLocaleRule,
  defaultWeightedCreditSlotValidator,
} from "./weighted-credit-slot-rules.js";
import { newWeightedCreditSlot } from "./weighted-credit-slot.js";

test("WeightedCreditSlotValidator reports every problem", () => {
  const validator = defaultWeightedCreditSlotValidator();
  const item = newWeightedCreditSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedCreditSlotFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new WeightedCreditSlotFrequencyCapRangeRule(16, 1000);
  const item = newWeightedCreditSlot("x", "y");
  item.frequencyCap = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedCreditSlotRequiredLocaleRule flags a blank locale", () => {
  const rule = new WeightedCreditSlotRequiredLocaleRule("weighted credit slot needs a value");
  const item = newWeightedCreditSlot("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedCreditSlotNameLengthRule flags a long name", () => {
  const rule = new WeightedCreditSlotNameLengthRule(120);
  const item = newWeightedCreditSlot("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedCreditSlotConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new WeightedCreditSlotConversionRateRangeRule(3.2, 3733.6);
  const item = newWeightedCreditSlot("x", "y");
  item.conversionRate = 3735.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedCreditSlotRequiredCodeRule flags a blank code", () => {
  const rule = new WeightedCreditSlotRequiredCodeRule("weighted credit slot needs an entry");
  const item = newWeightedCreditSlot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
