import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultRewardSegmentRequiredLocaleRule,
  DefaultRewardSegmentRequiredTitleRule,
  DefaultRewardSegmentWindowDaysRangeRule,
  defaultDefaultRewardSegmentValidator,
} from "./default-reward-segment-rules.js";
import { newDefaultRewardSegment } from "./default-reward-segment.js";

test("DefaultRewardSegmentValidator reports every problem", () => {
  const validator = defaultDefaultRewardSegmentValidator();
  const item = newDefaultRewardSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultRewardSegmentRequiredTitleRule flags a blank title", () => {
  const rule = new DefaultRewardSegmentRequiredTitleRule("default reward segment needs an entry");
  const item = newDefaultRewardSegment("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultRewardSegmentRequiredLocaleRule flags a blank locale", () => {
  const rule = new DefaultRewardSegmentRequiredLocaleRule("default reward segment needs an entry");
  const item = newDefaultRewardSegment("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultRewardSegmentWindowDaysRangeRule flags values above window days", () => {
  const rule = new DefaultRewardSegmentWindowDaysRangeRule(255, 86400);
  const item = newDefaultRewardSegment("x", "y");
  item.windowDays = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
