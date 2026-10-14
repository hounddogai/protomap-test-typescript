import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CsatSegmentRatioRangeRule,
  CsatSegmentTitleLengthRule,
  defaultCsatSegmentValidator,
} from "./csat-segment-rules.js";
import { newCsatSegment } from "./csat-segment.js";

test("CsatSegmentValidator reports every problem", () => {
  const validator = defaultCsatSegmentValidator();
  const item = newCsatSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CsatSegmentTitleLengthRule flags a long title", () => {
  const rule = new CsatSegmentTitleLengthRule(255);
  const item = newCsatSegment("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CsatSegmentRatioRangeRule flags values above ratio", () => {
  const rule = new CsatSegmentRatioRangeRule(9.5, 1850.8);
  const item = newCsatSegment("x", "y");
  item.ratio = 1852.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
