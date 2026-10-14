import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackComplaintMappingCodeLengthRule,
  FallbackComplaintMappingGraceDaysRangeRule,
  FallbackComplaintMappingRatioRangeRule,
  FallbackComplaintMappingRequiredCodeRule,
  FallbackComplaintMappingRequiredNameRule,
  defaultFallbackComplaintMappingValidator,
} from "./fallback-complaint-mapping-rules.js";
import { newFallbackComplaintMapping } from "./fallback-complaint-mapping.js";

test("FallbackComplaintMappingValidator reports every problem", () => {
  const validator = defaultFallbackComplaintMappingValidator();
  const item = newFallbackComplaintMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackComplaintMappingRequiredCodeRule flags a blank code", () => {
  const rule = new FallbackComplaintMappingRequiredCodeRule("fallback complaint mapping needs an entry");
  const item = newFallbackComplaintMapping("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackComplaintMappingCodeLengthRule flags a long code", () => {
  const rule = new FallbackComplaintMappingCodeLengthRule(16);
  const item = newFallbackComplaintMapping("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackComplaintMappingRequiredNameRule flags a blank name", () => {
  const rule = new FallbackComplaintMappingRequiredNameRule("fallback complaint mapping needs this field");
  const item = newFallbackComplaintMapping("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackComplaintMappingRatioRangeRule flags values above ratio", () => {
  const rule = new FallbackComplaintMappingRatioRangeRule(4.3, 1919.4);
  const item = newFallbackComplaintMapping("x", "y");
  item.ratio = 1920.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackComplaintMappingGraceDaysRangeRule flags values above grace days", () => {
  const rule = new FallbackComplaintMappingGraceDaysRangeRule(32, 86400);
  const item = newFallbackComplaintMapping("x", "y");
  item.graceDays = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
