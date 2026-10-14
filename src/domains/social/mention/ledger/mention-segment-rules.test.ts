import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MentionSegmentRequiredCodeRule,
  MentionSegmentScoreRangeRule,
  MentionSegmentVersionRangeRule,
  defaultMentionSegmentValidator,
} from "./mention-segment-rules.js";
import { newMentionSegment } from "./mention-segment.js";

test("MentionSegmentValidator reports every problem", () => {
  const validator = defaultMentionSegmentValidator();
  const item = newMentionSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("MentionSegmentScoreRangeRule flags values above score", () => {
  const rule = new MentionSegmentScoreRangeRule(7.3, 553.3);
  const item = newMentionSegment("x", "y");
  item.score = 554.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("MentionSegmentVersionRangeRule flags values above version", () => {
  const rule = new MentionSegmentVersionRangeRule(80, 3600);
  const item = newMentionSegment("x", "y");
  item.version = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("MentionSegmentRequiredCodeRule flags a blank code", () => {
  const rule = new MentionSegmentRequiredCodeRule("mention segment needs this field");
  const item = newMentionSegment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
