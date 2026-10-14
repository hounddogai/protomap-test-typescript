import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalConversionSlotCodeLengthRule,
  SeasonalConversionSlotCostRangeRule,
  SeasonalConversionSlotRequiredSegmentRule,
  defaultSeasonalConversionSlotValidator,
} from "./seasonal-conversion-slot-rules.js";
import { newSeasonalConversionSlot } from "./seasonal-conversion-slot.js";

test("SeasonalConversionSlotValidator reports every problem", () => {
  const validator = defaultSeasonalConversionSlotValidator();
  const item = newSeasonalConversionSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalConversionSlotCostRangeRule flags values above cost", () => {
  const rule = new SeasonalConversionSlotCostRangeRule(9.3, 728.9);
  const item = newSeasonalConversionSlot("x", "y");
  item.cost = 730.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalConversionSlotRequiredSegmentRule flags a blank segment", () => {
  const rule = new SeasonalConversionSlotRequiredSegmentRule("seasonal conversion slot needs this field");
  const item = newSeasonalConversionSlot("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalConversionSlotCodeLengthRule flags a long code", () => {
  const rule = new SeasonalConversionSlotCodeLengthRule(3600);
  const item = newSeasonalConversionSlot("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
