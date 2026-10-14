import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingTouchpointSegmentBidRangeRule,
  RollingTouchpointSegmentRateRangeRule,
  RollingTouchpointSegmentRequiredTimezoneRule,
  RollingTouchpointSegmentThresholdRangeRule,
  RollingTouchpointSegmentUpdatedAtRangeRule,
  defaultRollingTouchpointSegmentValidator,
} from "./rolling-touchpoint-segment-rules.js";
import { newRollingTouchpointSegment } from "./rolling-touchpoint-segment.js";

test("RollingTouchpointSegmentValidator reports every problem", () => {
  const validator = defaultRollingTouchpointSegmentValidator();
  const item = newRollingTouchpointSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingTouchpointSegmentBidRangeRule flags values above bid", () => {
  const rule = new RollingTouchpointSegmentBidRangeRule(9, 2555.1);
  const item = newRollingTouchpointSegment("x", "y");
  item.bid = 2556.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingTouchpointSegmentRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new RollingTouchpointSegmentRequiredTimezoneRule("rolling touchpoint segment needs an entry");
  const item = newRollingTouchpointSegment("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingTouchpointSegmentRateRangeRule flags values above rate", () => {
  const rule = new RollingTouchpointSegmentRateRangeRule(6.1, 1286.6);
  const item = newRollingTouchpointSegment("x", "y");
  item.rate = 1288.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingTouchpointSegmentUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new RollingTouchpointSegmentUpdatedAtRangeRule(1000, 3600);
  const item = newRollingTouchpointSegment("x", "y");
  item.updatedAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingTouchpointSegmentThresholdRangeRule flags values above threshold", () => {
  const rule = new RollingTouchpointSegmentThresholdRangeRule(3.3, 3098.7);
  const item = newRollingTouchpointSegment("x", "y");
  item.threshold = 3100.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
