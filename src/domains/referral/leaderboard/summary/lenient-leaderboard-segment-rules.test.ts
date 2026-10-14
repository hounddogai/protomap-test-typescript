import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientLeaderboardSegmentCodeLengthRule,
  LenientLeaderboardSegmentRequiredNameRule,
  LenientLeaderboardSegmentRevisionRangeRule,
  LenientLeaderboardSegmentUpdatedAtRangeRule,
  LenientLeaderboardSegmentUtmSourceLengthRule,
  defaultLenientLeaderboardSegmentValidator,
} from "./lenient-leaderboard-segment-rules.js";
import { newLenientLeaderboardSegment } from "./lenient-leaderboard-segment.js";

test("LenientLeaderboardSegmentValidator reports every problem", () => {
  const validator = defaultLenientLeaderboardSegmentValidator();
  const item = newLenientLeaderboardSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientLeaderboardSegmentCodeLengthRule flags a long code", () => {
  const rule = new LenientLeaderboardSegmentCodeLengthRule(80);
  const item = newLenientLeaderboardSegment("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientLeaderboardSegmentRevisionRangeRule flags values above revision", () => {
  const rule = new LenientLeaderboardSegmentRevisionRangeRule(255, 86400);
  const item = newLenientLeaderboardSegment("x", "y");
  item.revision = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientLeaderboardSegmentUtmSourceLengthRule flags a long utm source", () => {
  const rule = new LenientLeaderboardSegmentUtmSourceLengthRule(64);
  const item = newLenientLeaderboardSegment("x", "y");
  item.utmSource = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientLeaderboardSegmentUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new LenientLeaderboardSegmentUpdatedAtRangeRule(16, 1000);
  const item = newLenientLeaderboardSegment("x", "y");
  item.updatedAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientLeaderboardSegmentRequiredNameRule flags a blank name", () => {
  const rule = new LenientLeaderboardSegmentRequiredNameRule("lenient leaderboard segment needs a value");
  const item = newLenientLeaderboardSegment("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
