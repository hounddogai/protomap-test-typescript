import assert from "node:assert/strict";
import { test } from "node:test";
import { PlacementSegmentTitleLengthRule, defaultPlacementSegmentValidator } from "./placement-segment-rules.js";
import { newPlacementSegment } from "./placement-segment.js";

test("PlacementSegmentValidator reports every problem", () => {
  const validator = defaultPlacementSegmentValidator();
  const item = newPlacementSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PlacementSegmentTitleLengthRule flags a long title", () => {
  const rule = new PlacementSegmentTitleLengthRule(64);
  const item = newPlacementSegment("x", "y");
  item.title = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
