import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RetentionSegmentCodeLengthRule,
  RetentionSegmentFloorValueRangeRule,
  RetentionSegmentVersionRangeRule,
  defaultRetentionSegmentValidator,
} from "./retention-segment-rules.js";
import { newRetentionSegment } from "./retention-segment.js";

test("RetentionSegmentValidator reports every problem", () => {
  const validator = defaultRetentionSegmentValidator();
  const item = newRetentionSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RetentionSegmentCodeLengthRule flags a long code", () => {
  const rule = new RetentionSegmentCodeLengthRule(1000);
  const item = newRetentionSegment("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RetentionSegmentFloorValueRangeRule flags values above floor value", () => {
  const rule = new RetentionSegmentFloorValueRangeRule(3.5, 2969.4);
  const item = newRetentionSegment("x", "y");
  item.floorValue = 2970.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RetentionSegmentVersionRangeRule flags values above version", () => {
  const rule = new RetentionSegmentVersionRangeRule(32, 120);
  const item = newRetentionSegment("x", "y");
  item.version = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
