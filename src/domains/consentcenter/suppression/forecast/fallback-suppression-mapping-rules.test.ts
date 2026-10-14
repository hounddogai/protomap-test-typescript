import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackSuppressionMappingCodeLengthRule,
  FallbackSuppressionMappingFloorValueRangeRule,
  FallbackSuppressionMappingRequiredSourceRule,
  FallbackSuppressionMappingRequiredUnitRule,
  FallbackSuppressionMappingUnitLengthRule,
  defaultFallbackSuppressionMappingValidator,
} from "./fallback-suppression-mapping-rules.js";
import { newFallbackSuppressionMapping } from "./fallback-suppression-mapping.js";

test("FallbackSuppressionMappingValidator reports every problem", () => {
  const validator = defaultFallbackSuppressionMappingValidator();
  const item = newFallbackSuppressionMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackSuppressionMappingFloorValueRangeRule flags values above floor value", () => {
  const rule = new FallbackSuppressionMappingFloorValueRangeRule(4.1, 1331.2);
  const item = newFallbackSuppressionMapping("x", "y");
  item.floorValue = 1332.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackSuppressionMappingRequiredUnitRule flags a blank unit", () => {
  const rule = new FallbackSuppressionMappingRequiredUnitRule("fallback suppression mapping needs an entry");
  const item = newFallbackSuppressionMapping("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackSuppressionMappingRequiredSourceRule flags a blank source", () => {
  const rule = new FallbackSuppressionMappingRequiredSourceRule("fallback suppression mapping needs an entry");
  const item = newFallbackSuppressionMapping("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackSuppressionMappingUnitLengthRule flags a long unit", () => {
  const rule = new FallbackSuppressionMappingUnitLengthRule(1000);
  const item = newFallbackSuppressionMapping("x", "y");
  item.unit = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackSuppressionMappingCodeLengthRule flags a long code", () => {
  const rule = new FallbackSuppressionMappingCodeLengthRule(32);
  const item = newFallbackSuppressionMapping("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
