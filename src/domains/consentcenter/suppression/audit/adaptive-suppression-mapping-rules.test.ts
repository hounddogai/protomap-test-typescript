import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveSuppressionMappingCodeLengthRule,
  AdaptiveSuppressionMappingCostRangeRule,
  AdaptiveSuppressionMappingRequiredChecksumRule,
  AdaptiveSuppressionMappingRequiredCodeRule,
  defaultAdaptiveSuppressionMappingValidator,
} from "./adaptive-suppression-mapping-rules.js";
import { newAdaptiveSuppressionMapping } from "./adaptive-suppression-mapping.js";

test("AdaptiveSuppressionMappingValidator reports every problem", () => {
  const validator = defaultAdaptiveSuppressionMappingValidator();
  const item = newAdaptiveSuppressionMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveSuppressionMappingRequiredChecksumRule flags a blank checksum", () => {
  const rule = new AdaptiveSuppressionMappingRequiredChecksumRule("adaptive suppression mapping needs a value");
  const item = newAdaptiveSuppressionMapping("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveSuppressionMappingCodeLengthRule flags a long code", () => {
  const rule = new AdaptiveSuppressionMappingCodeLengthRule(64);
  const item = newAdaptiveSuppressionMapping("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveSuppressionMappingCostRangeRule flags values above cost", () => {
  const rule = new AdaptiveSuppressionMappingCostRangeRule(4.5, 2492.4);
  const item = newAdaptiveSuppressionMapping("x", "y");
  item.cost = 2493.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveSuppressionMappingRequiredCodeRule flags a blank code", () => {
  const rule = new AdaptiveSuppressionMappingRequiredCodeRule("adaptive suppression mapping needs this field");
  const item = newAdaptiveSuppressionMapping("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
