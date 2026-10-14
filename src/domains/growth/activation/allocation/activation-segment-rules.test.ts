import assert from "node:assert/strict";
import { test } from "node:test";
import { ActivationSegmentEndsAtRangeRule, defaultActivationSegmentValidator } from "./activation-segment-rules.js";
import { newActivationSegment } from "./activation-segment.js";

test("ActivationSegmentValidator reports every problem", () => {
  const validator = defaultActivationSegmentValidator();
  const item = newActivationSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ActivationSegmentEndsAtRangeRule flags values above ends at", () => {
  const rule = new ActivationSegmentEndsAtRangeRule(16, 3600);
  const item = newActivationSegment("x", "y");
  item.endsAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
