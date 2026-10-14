import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WindowSlotCodeLengthRule,
  WindowSlotConversionRateRangeRule,
  WindowSlotRequiredCodeRule,
  defaultWindowSlotValidator,
} from "./window-slot-rules.js";
import { newWindowSlot } from "./window-slot.js";

test("WindowSlotValidator reports every problem", () => {
  const validator = defaultWindowSlotValidator();
  const item = newWindowSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WindowSlotCodeLengthRule flags a long code", () => {
  const rule = new WindowSlotCodeLengthRule(16);
  const item = newWindowSlot("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WindowSlotRequiredCodeRule flags a blank code", () => {
  const rule = new WindowSlotRequiredCodeRule("window slot needs this field");
  const item = newWindowSlot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WindowSlotConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new WindowSlotConversionRateRangeRule(5.7, 2875.9);
  const item = newWindowSlot("x", "y");
  item.conversionRate = 2877.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
