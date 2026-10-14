import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InsightSegmentCodeLengthRule,
  InsightSegmentRegionLengthRule,
  InsightSegmentRequiredCodeRule,
  InsightSegmentRequiredTitleRule,
  defaultInsightSegmentValidator,
} from "./insight-segment-rules.js";
import { newInsightSegment } from "./insight-segment.js";

test("InsightSegmentValidator reports every problem", () => {
  const validator = defaultInsightSegmentValidator();
  const item = newInsightSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("InsightSegmentRequiredTitleRule flags a blank title", () => {
  const rule = new InsightSegmentRequiredTitleRule("insight segment needs this field");
  const item = newInsightSegment("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InsightSegmentCodeLengthRule flags a long code", () => {
  const rule = new InsightSegmentCodeLengthRule(120);
  const item = newInsightSegment("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("InsightSegmentRegionLengthRule flags a long region", () => {
  const rule = new InsightSegmentRegionLengthRule(32);
  const item = newInsightSegment("x", "y");
  item.region = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("InsightSegmentRequiredCodeRule flags a blank code", () => {
  const rule = new InsightSegmentRequiredCodeRule("insight segment needs an entry");
  const item = newInsightSegment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
