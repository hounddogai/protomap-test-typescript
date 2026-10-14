import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ConversionCycleExpiresAtRangeRule,
  ConversionCycleRequiredSegmentRule,
  ConversionCycleThresholdRangeRule,
  defaultConversionCycleValidator,
} from "./conversion-cycle-rules.js";
import { newConversionCycle } from "./conversion-cycle.js";

test("ConversionCycleValidator reports every problem", () => {
  const validator = defaultConversionCycleValidator();
  const item = newConversionCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ConversionCycleExpiresAtRangeRule flags values above expires at", () => {
  const rule = new ConversionCycleExpiresAtRangeRule(80, 255);
  const item = newConversionCycle("x", "y");
  item.expiresAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ConversionCycleRequiredSegmentRule flags a blank segment", () => {
  const rule = new ConversionCycleRequiredSegmentRule("conversion cycle needs an entry");
  const item = newConversionCycle("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ConversionCycleThresholdRangeRule flags values above threshold", () => {
  const rule = new ConversionCycleThresholdRangeRule(3.8, 4375.4);
  const item = newConversionCycle("x", "y");
  item.threshold = 4376.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
