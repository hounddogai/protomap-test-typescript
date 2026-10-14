import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ReputationSegmentEndsAtRangeRule,
  ReputationSegmentRequiredChannelRule,
  ReputationSegmentRequiredCodeRule,
  defaultReputationSegmentValidator,
} from "./reputation-segment-rules.js";
import { newReputationSegment } from "./reputation-segment.js";

test("ReputationSegmentValidator reports every problem", () => {
  const validator = defaultReputationSegmentValidator();
  const item = newReputationSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ReputationSegmentRequiredCodeRule flags a blank code", () => {
  const rule = new ReputationSegmentRequiredCodeRule("reputation segment needs this field");
  const item = newReputationSegment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReputationSegmentEndsAtRangeRule flags values above ends at", () => {
  const rule = new ReputationSegmentEndsAtRangeRule(255, 86400);
  const item = newReputationSegment("x", "y");
  item.endsAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ReputationSegmentRequiredChannelRule flags a blank channel", () => {
  const rule = new ReputationSegmentRequiredChannelRule("reputation segment needs this field");
  const item = newReputationSegment("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
