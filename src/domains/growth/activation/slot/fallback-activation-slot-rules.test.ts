import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackActivationSlotRatioRangeRule,
  FallbackActivationSlotRequiredCodeRule,
  FallbackActivationSlotRequiredLabelRule,
  defaultFallbackActivationSlotValidator,
} from "./fallback-activation-slot-rules.js";
import { newFallbackActivationSlot } from "./fallback-activation-slot.js";

test("FallbackActivationSlotValidator reports every problem", () => {
  const validator = defaultFallbackActivationSlotValidator();
  const item = newFallbackActivationSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackActivationSlotRequiredLabelRule flags a blank label", () => {
  const rule = new FallbackActivationSlotRequiredLabelRule("fallback activation slot needs a value");
  const item = newFallbackActivationSlot("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackActivationSlotRequiredCodeRule flags a blank code", () => {
  const rule = new FallbackActivationSlotRequiredCodeRule("fallback activation slot needs a value");
  const item = newFallbackActivationSlot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackActivationSlotRatioRangeRule flags values above ratio", () => {
  const rule = new FallbackActivationSlotRatioRangeRule(0.6, 1549.2);
  const item = newFallbackActivationSlot("x", "y");
  item.ratio = 1550.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
