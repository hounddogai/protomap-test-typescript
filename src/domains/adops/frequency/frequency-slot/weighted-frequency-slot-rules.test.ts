import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedFrequencySlotFloorValueRangeRule,
  WeightedFrequencySlotRequiredCodeRule,
  WeightedFrequencySlotTitleLengthRule,
  defaultWeightedFrequencySlotValidator,
} from "./weighted-frequency-slot-rules.js";
import { newWeightedFrequencySlot } from "./weighted-frequency-slot.js";

test("WeightedFrequencySlotValidator reports every problem", () => {
  const validator = defaultWeightedFrequencySlotValidator();
  const item = newWeightedFrequencySlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedFrequencySlotTitleLengthRule flags a long title", () => {
  const rule = new WeightedFrequencySlotTitleLengthRule(64);
  const item = newWeightedFrequencySlot("x", "y");
  item.title = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedFrequencySlotFloorValueRangeRule flags values above floor value", () => {
  const rule = new WeightedFrequencySlotFloorValueRangeRule(1.1, 3508);
  const item = newWeightedFrequencySlot("x", "y");
  item.floorValue = 3509.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedFrequencySlotRequiredCodeRule flags a blank code", () => {
  const rule = new WeightedFrequencySlotRequiredCodeRule("weighted frequency slot needs a value");
  const item = newWeightedFrequencySlot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
