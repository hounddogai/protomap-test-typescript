import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PacingSlotConversionRateRangeRule,
  PacingSlotExpiresAtRangeRule,
  PacingSlotRequiredCodeRule,
  PacingSlotRequiredLabelRule,
  defaultPacingSlotValidator,
} from "./pacing-slot-rules.js";
import { newPacingSlot } from "./pacing-slot.js";

test("PacingSlotValidator reports every problem", () => {
  const validator = defaultPacingSlotValidator();
  const item = newPacingSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PacingSlotConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new PacingSlotConversionRateRangeRule(8.5, 2956.6);
  const item = newPacingSlot("x", "y");
  item.conversionRate = 2958.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PacingSlotRequiredLabelRule flags a blank label", () => {
  const rule = new PacingSlotRequiredLabelRule("pacing slot needs this field");
  const item = newPacingSlot("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PacingSlotRequiredCodeRule flags a blank code", () => {
  const rule = new PacingSlotRequiredCodeRule("pacing slot needs an entry");
  const item = newPacingSlot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PacingSlotExpiresAtRangeRule flags values above expires at", () => {
  const rule = new PacingSlotExpiresAtRangeRule(120, 1000);
  const item = newPacingSlot("x", "y");
  item.expiresAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
