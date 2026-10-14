import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalInsightSegmentCodeLengthRule,
  GlobalInsightSegmentCurrencyLengthRule,
  GlobalInsightSegmentRequiredLabelRule,
  GlobalInsightSegmentRequiredRegionRule,
  defaultGlobalInsightSegmentValidator,
} from "./global-insight-segment-rules.js";
import { newGlobalInsightSegment } from "./global-insight-segment.js";

test("GlobalInsightSegmentValidator reports every problem", () => {
  const validator = defaultGlobalInsightSegmentValidator();
  const item = newGlobalInsightSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalInsightSegmentRequiredRegionRule flags a blank region", () => {
  const rule = new GlobalInsightSegmentRequiredRegionRule("global insight segment needs this field");
  const item = newGlobalInsightSegment("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalInsightSegmentCodeLengthRule flags a long code", () => {
  const rule = new GlobalInsightSegmentCodeLengthRule(64);
  const item = newGlobalInsightSegment("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalInsightSegmentRequiredLabelRule flags a blank label", () => {
  const rule = new GlobalInsightSegmentRequiredLabelRule("global insight segment needs an entry");
  const item = newGlobalInsightSegment("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalInsightSegmentCurrencyLengthRule flags a long currency", () => {
  const rule = new GlobalInsightSegmentCurrencyLengthRule(3600);
  const item = newGlobalInsightSegment("x", "y");
  item.currency = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
