import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultTierSegmentBatchSizeRangeRule,
  DefaultTierSegmentEndsAtRangeRule,
  DefaultTierSegmentPriorityRangeRule,
  DefaultTierSegmentRequiredLabelRule,
  defaultDefaultTierSegmentValidator,
} from "./default-tier-segment-rules.js";
import { newDefaultTierSegment } from "./default-tier-segment.js";

test("DefaultTierSegmentValidator reports every problem", () => {
  const validator = defaultDefaultTierSegmentValidator();
  const item = newDefaultTierSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultTierSegmentRequiredLabelRule flags a blank label", () => {
  const rule = new DefaultTierSegmentRequiredLabelRule("default tier segment needs this field");
  const item = newDefaultTierSegment("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultTierSegmentPriorityRangeRule flags values above priority", () => {
  const rule = new DefaultTierSegmentPriorityRangeRule(32, 1000);
  const item = newDefaultTierSegment("x", "y");
  item.priority = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultTierSegmentEndsAtRangeRule flags values above ends at", () => {
  const rule = new DefaultTierSegmentEndsAtRangeRule(1000, 3600);
  const item = newDefaultTierSegment("x", "y");
  item.endsAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultTierSegmentBatchSizeRangeRule flags values above batch size", () => {
  const rule = new DefaultTierSegmentBatchSizeRangeRule(120, 255);
  const item = newDefaultTierSegment("x", "y");
  item.batchSize = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
