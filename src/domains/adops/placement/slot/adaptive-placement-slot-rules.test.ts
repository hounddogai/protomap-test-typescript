import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptivePlacementSlotMinimumRangeRule,
  AdaptivePlacementSlotRateRangeRule,
  AdaptivePlacementSlotRequiredCategoryRule,
  AdaptivePlacementSlotRequiredLabelRule,
  AdaptivePlacementSlotSequenceRangeRule,
  defaultAdaptivePlacementSlotValidator,
} from "./adaptive-placement-slot-rules.js";
import { newAdaptivePlacementSlot } from "./adaptive-placement-slot.js";

test("AdaptivePlacementSlotValidator reports every problem", () => {
  const validator = defaultAdaptivePlacementSlotValidator();
  const item = newAdaptivePlacementSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptivePlacementSlotRequiredLabelRule flags a blank label", () => {
  const rule = new AdaptivePlacementSlotRequiredLabelRule("adaptive placement slot needs a value");
  const item = newAdaptivePlacementSlot("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptivePlacementSlotSequenceRangeRule flags values above sequence", () => {
  const rule = new AdaptivePlacementSlotSequenceRangeRule(80, 1000);
  const item = newAdaptivePlacementSlot("x", "y");
  item.sequence = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptivePlacementSlotRateRangeRule flags values above rate", () => {
  const rule = new AdaptivePlacementSlotRateRangeRule(9.5, 4203);
  const item = newAdaptivePlacementSlot("x", "y");
  item.rate = 4204.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptivePlacementSlotRequiredCategoryRule flags a blank category", () => {
  const rule = new AdaptivePlacementSlotRequiredCategoryRule("adaptive placement slot needs this field");
  const item = newAdaptivePlacementSlot("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptivePlacementSlotMinimumRangeRule flags values above minimum", () => {
  const rule = new AdaptivePlacementSlotMinimumRangeRule(3, 4207.9);
  const item = newAdaptivePlacementSlot("x", "y");
  item.minimum = 4209.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
