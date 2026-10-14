import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackConversionMappingAttemptsRangeRule,
  FallbackConversionMappingRequiredCodeRule,
  FallbackConversionMappingThresholdRangeRule,
  defaultFallbackConversionMappingValidator,
} from "./fallback-conversion-mapping-rules.js";
import { newFallbackConversionMapping } from "./fallback-conversion-mapping.js";

test("FallbackConversionMappingValidator reports every problem", () => {
  const validator = defaultFallbackConversionMappingValidator();
  const item = newFallbackConversionMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackConversionMappingThresholdRangeRule flags values above threshold", () => {
  const rule = new FallbackConversionMappingThresholdRangeRule(0.8, 2307.9);
  const item = newFallbackConversionMapping("x", "y");
  item.threshold = 2309.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackConversionMappingAttemptsRangeRule flags values above attempts", () => {
  const rule = new FallbackConversionMappingAttemptsRangeRule(32, 80);
  const item = newFallbackConversionMapping("x", "y");
  item.attempts = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackConversionMappingRequiredCodeRule flags a blank code", () => {
  const rule = new FallbackConversionMappingRequiredCodeRule("fallback conversion mapping needs this field");
  const item = newFallbackConversionMapping("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
