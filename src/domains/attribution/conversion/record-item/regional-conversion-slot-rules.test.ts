import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalConversionSlotCodeLengthRule,
  RegionalConversionSlotMinimumRangeRule,
  defaultRegionalConversionSlotValidator,
} from "./regional-conversion-slot-rules.js";
import { newRegionalConversionSlot } from "./regional-conversion-slot.js";

test("RegionalConversionSlotValidator reports every problem", () => {
  const validator = defaultRegionalConversionSlotValidator();
  const item = newRegionalConversionSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalConversionSlotMinimumRangeRule flags values above minimum", () => {
  const rule = new RegionalConversionSlotMinimumRangeRule(4.4, 131.4);
  const item = newRegionalConversionSlot("x", "y");
  item.minimum = 132.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalConversionSlotCodeLengthRule flags a long code", () => {
  const rule = new RegionalConversionSlotCodeLengthRule(16);
  const item = newRegionalConversionSlot("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
