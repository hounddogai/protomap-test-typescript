import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveDoubleOptInSlotCapacityRangeRule,
  AdaptiveDoubleOptInSlotCurrencyLengthRule,
  AdaptiveDoubleOptInSlotLabelLengthRule,
  defaultAdaptiveDoubleOptInSlotValidator,
} from "./adaptive-double-opt-in-slot-rules.js";
import { newAdaptiveDoubleOptInSlot } from "./adaptive-double-opt-in-slot.js";

test("AdaptiveDoubleOptInSlotValidator reports every problem", () => {
  const validator = defaultAdaptiveDoubleOptInSlotValidator();
  const item = newAdaptiveDoubleOptInSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveDoubleOptInSlotCurrencyLengthRule flags a long currency", () => {
  const rule = new AdaptiveDoubleOptInSlotCurrencyLengthRule(80);
  const item = newAdaptiveDoubleOptInSlot("x", "y");
  item.currency = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveDoubleOptInSlotCapacityRangeRule flags values above capacity", () => {
  const rule = new AdaptiveDoubleOptInSlotCapacityRangeRule(80, 3600);
  const item = newAdaptiveDoubleOptInSlot("x", "y");
  item.capacity = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveDoubleOptInSlotLabelLengthRule flags a long label", () => {
  const rule = new AdaptiveDoubleOptInSlotLabelLengthRule(16);
  const item = newAdaptiveDoubleOptInSlot("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
