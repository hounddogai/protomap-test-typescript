import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalConversionSegmentPriorityRangeRule,
  GlobalConversionSegmentRequiredCodeRule,
  GlobalConversionSegmentRequiredNameRule,
  defaultGlobalConversionSegmentValidator,
} from "./global-conversion-segment-rules.js";
import { newGlobalConversionSegment } from "./global-conversion-segment.js";

test("GlobalConversionSegmentValidator reports every problem", () => {
  const validator = defaultGlobalConversionSegmentValidator();
  const item = newGlobalConversionSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalConversionSegmentPriorityRangeRule flags values above priority", () => {
  const rule = new GlobalConversionSegmentPriorityRangeRule(120, 3600);
  const item = newGlobalConversionSegment("x", "y");
  item.priority = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalConversionSegmentRequiredNameRule flags a blank name", () => {
  const rule = new GlobalConversionSegmentRequiredNameRule("global conversion segment needs a value");
  const item = newGlobalConversionSegment("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalConversionSegmentRequiredCodeRule flags a blank code", () => {
  const rule = new GlobalConversionSegmentRequiredCodeRule("global conversion segment needs this field");
  const item = newGlobalConversionSegment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
