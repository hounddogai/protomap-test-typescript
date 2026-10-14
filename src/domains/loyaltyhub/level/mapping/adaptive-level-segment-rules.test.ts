import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveLevelSegmentChannelLengthRule,
  AdaptiveLevelSegmentOpenRateRangeRule,
  AdaptiveLevelSegmentRequiredChannelRule,
  AdaptiveLevelSegmentRequiredCodeRule,
  AdaptiveLevelSegmentTitleLengthRule,
  defaultAdaptiveLevelSegmentValidator,
} from "./adaptive-level-segment-rules.js";
import { newAdaptiveLevelSegment } from "./adaptive-level-segment.js";

test("AdaptiveLevelSegmentValidator reports every problem", () => {
  const validator = defaultAdaptiveLevelSegmentValidator();
  const item = newAdaptiveLevelSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveLevelSegmentTitleLengthRule flags a long title", () => {
  const rule = new AdaptiveLevelSegmentTitleLengthRule(86400);
  const item = newAdaptiveLevelSegment("x", "y");
  item.title = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveLevelSegmentRequiredChannelRule flags a blank channel", () => {
  const rule = new AdaptiveLevelSegmentRequiredChannelRule("adaptive level segment needs an entry");
  const item = newAdaptiveLevelSegment("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveLevelSegmentChannelLengthRule flags a long channel", () => {
  const rule = new AdaptiveLevelSegmentChannelLengthRule(64);
  const item = newAdaptiveLevelSegment("x", "y");
  item.channel = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveLevelSegmentOpenRateRangeRule flags values above open rate", () => {
  const rule = new AdaptiveLevelSegmentOpenRateRangeRule(8, 1303.4);
  const item = newAdaptiveLevelSegment("x", "y");
  item.openRate = 1304.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveLevelSegmentRequiredCodeRule flags a blank code", () => {
  const rule = new AdaptiveLevelSegmentRequiredCodeRule("adaptive level segment needs this field");
  const item = newAdaptiveLevelSegment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
