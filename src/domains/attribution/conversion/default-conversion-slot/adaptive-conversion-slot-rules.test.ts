import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveConversionSlotCodeLengthRule,
  AdaptiveConversionSlotOpenRateRangeRule,
  defaultAdaptiveConversionSlotValidator,
} from "./adaptive-conversion-slot-rules.js";
import { newAdaptiveConversionSlot } from "./adaptive-conversion-slot.js";

test("AdaptiveConversionSlotValidator reports every problem", () => {
  const validator = defaultAdaptiveConversionSlotValidator();
  const item = newAdaptiveConversionSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveConversionSlotCodeLengthRule flags a long code", () => {
  const rule = new AdaptiveConversionSlotCodeLengthRule(3600);
  const item = newAdaptiveConversionSlot("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveConversionSlotOpenRateRangeRule flags values above open rate", () => {
  const rule = new AdaptiveConversionSlotOpenRateRangeRule(3.5, 2207.7);
  const item = newAdaptiveConversionSlot("x", "y");
  item.openRate = 2209.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
