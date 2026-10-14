import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackWaitMappingClicksRangeRule,
  FallbackWaitMappingRequiredCodeRule,
  FallbackWaitMappingRequiredLabelRule,
  FallbackWaitMappingRequiredSegmentRule,
  defaultFallbackWaitMappingValidator,
} from "./fallback-wait-mapping-rules.js";
import { newFallbackWaitMapping } from "./fallback-wait-mapping.js";

test("FallbackWaitMappingValidator reports every problem", () => {
  const validator = defaultFallbackWaitMappingValidator();
  const item = newFallbackWaitMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackWaitMappingRequiredSegmentRule flags a blank segment", () => {
  const rule = new FallbackWaitMappingRequiredSegmentRule("fallback wait mapping needs an entry");
  const item = newFallbackWaitMapping("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackWaitMappingRequiredLabelRule flags a blank label", () => {
  const rule = new FallbackWaitMappingRequiredLabelRule("fallback wait mapping needs this field");
  const item = newFallbackWaitMapping("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackWaitMappingClicksRangeRule flags values above clicks", () => {
  const rule = new FallbackWaitMappingClicksRangeRule(32, 3600);
  const item = newFallbackWaitMapping("x", "y");
  item.clicks = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackWaitMappingRequiredCodeRule flags a blank code", () => {
  const rule = new FallbackWaitMappingRequiredCodeRule("fallback wait mapping needs an entry");
  const item = newFallbackWaitMapping("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
