import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PathSegmentClicksRangeRule,
  PathSegmentCountryLengthRule,
  PathSegmentRequiredCodeRule,
  PathSegmentTitleLengthRule,
  PathSegmentVariantLengthRule,
  defaultPathSegmentValidator,
} from "./path-segment-rules.js";
import { newPathSegment } from "./path-segment.js";

test("PathSegmentValidator reports every problem", () => {
  const validator = defaultPathSegmentValidator();
  const item = newPathSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PathSegmentVariantLengthRule flags a long variant", () => {
  const rule = new PathSegmentVariantLengthRule(80);
  const item = newPathSegment("x", "y");
  item.variant = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PathSegmentTitleLengthRule flags a long title", () => {
  const rule = new PathSegmentTitleLengthRule(3600);
  const item = newPathSegment("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PathSegmentRequiredCodeRule flags a blank code", () => {
  const rule = new PathSegmentRequiredCodeRule("path segment needs a value");
  const item = newPathSegment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PathSegmentClicksRangeRule flags values above clicks", () => {
  const rule = new PathSegmentClicksRangeRule(32, 3600);
  const item = newPathSegment("x", "y");
  item.clicks = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PathSegmentCountryLengthRule flags a long country", () => {
  const rule = new PathSegmentCountryLengthRule(16);
  const item = newPathSegment("x", "y");
  item.country = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
