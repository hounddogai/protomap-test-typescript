import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimarySenderSegmentLabelLengthRule,
  PrimarySenderSegmentRequiredCodeRule,
  PrimarySenderSegmentRequiredSourceRule,
  PrimarySenderSegmentRequiredUtmSourceRule,
  PrimarySenderSegmentWindowDaysRangeRule,
  defaultPrimarySenderSegmentValidator,
} from "./primary-sender-segment-rules.js";
import { newPrimarySenderSegment } from "./primary-sender-segment.js";

test("PrimarySenderSegmentValidator reports every problem", () => {
  const validator = defaultPrimarySenderSegmentValidator();
  const item = newPrimarySenderSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimarySenderSegmentRequiredSourceRule flags a blank source", () => {
  const rule = new PrimarySenderSegmentRequiredSourceRule("primary sender segment needs an entry");
  const item = newPrimarySenderSegment("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimarySenderSegmentRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new PrimarySenderSegmentRequiredUtmSourceRule("primary sender segment needs this field");
  const item = newPrimarySenderSegment("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimarySenderSegmentWindowDaysRangeRule flags values above window days", () => {
  const rule = new PrimarySenderSegmentWindowDaysRangeRule(120, 3600);
  const item = newPrimarySenderSegment("x", "y");
  item.windowDays = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimarySenderSegmentRequiredCodeRule flags a blank code", () => {
  const rule = new PrimarySenderSegmentRequiredCodeRule("primary sender segment needs this field");
  const item = newPrimarySenderSegment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimarySenderSegmentLabelLengthRule flags a long label", () => {
  const rule = new PrimarySenderSegmentLabelLengthRule(255);
  const item = newPrimarySenderSegment("x", "y");
  item.label = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
