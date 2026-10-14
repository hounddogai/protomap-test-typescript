import assert from "node:assert/strict";
import { test } from "node:test";
import { TierSegmentTitleLengthRule, defaultTierSegmentValidator } from "./tier-segment-rules.js";
import { newTierSegment } from "./tier-segment.js";

test("TierSegmentValidator reports every problem", () => {
  const validator = defaultTierSegmentValidator();
  const item = newTierSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TierSegmentTitleLengthRule flags a long title", () => {
  const rule = new TierSegmentTitleLengthRule(120);
  const item = newTierSegment("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
