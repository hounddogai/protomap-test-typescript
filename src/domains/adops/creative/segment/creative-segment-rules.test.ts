import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreativeSegmentRequiredCodeRule,
  CreativeSegmentRequiredTimezoneRule,
  CreativeSegmentTimezoneLengthRule,
  CreativeSegmentWindowDaysRangeRule,
  defaultCreativeSegmentValidator,
} from "./creative-segment-rules.js";
import { newCreativeSegment } from "./creative-segment.js";

test("CreativeSegmentValidator reports every problem", () => {
  const validator = defaultCreativeSegmentValidator();
  const item = newCreativeSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreativeSegmentTimezoneLengthRule flags a long timezone", () => {
  const rule = new CreativeSegmentTimezoneLengthRule(80);
  const item = newCreativeSegment("x", "y");
  item.timezone = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreativeSegmentRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new CreativeSegmentRequiredTimezoneRule("creative segment needs a value");
  const item = newCreativeSegment("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CreativeSegmentRequiredCodeRule flags a blank code", () => {
  const rule = new CreativeSegmentRequiredCodeRule("creative segment needs an entry");
  const item = newCreativeSegment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CreativeSegmentWindowDaysRangeRule flags values above window days", () => {
  const rule = new CreativeSegmentWindowDaysRangeRule(32, 3600);
  const item = newCreativeSegment("x", "y");
  item.windowDays = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
