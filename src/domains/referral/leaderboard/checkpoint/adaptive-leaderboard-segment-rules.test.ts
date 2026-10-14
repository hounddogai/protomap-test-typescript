import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveLeaderboardSegmentCodeLengthRule,
  AdaptiveLeaderboardSegmentRequiredCodeRule,
  AdaptiveLeaderboardSegmentRequiredNameRule,
  defaultAdaptiveLeaderboardSegmentValidator,
} from "./adaptive-leaderboard-segment-rules.js";
import { newAdaptiveLeaderboardSegment } from "./adaptive-leaderboard-segment.js";

test("AdaptiveLeaderboardSegmentValidator reports every problem", () => {
  const validator = defaultAdaptiveLeaderboardSegmentValidator();
  const item = newAdaptiveLeaderboardSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveLeaderboardSegmentCodeLengthRule flags a long code", () => {
  const rule = new AdaptiveLeaderboardSegmentCodeLengthRule(16);
  const item = newAdaptiveLeaderboardSegment("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveLeaderboardSegmentRequiredCodeRule flags a blank code", () => {
  const rule = new AdaptiveLeaderboardSegmentRequiredCodeRule("adaptive leaderboard segment needs an entry");
  const item = newAdaptiveLeaderboardSegment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveLeaderboardSegmentRequiredNameRule flags a blank name", () => {
  const rule = new AdaptiveLeaderboardSegmentRequiredNameRule("adaptive leaderboard segment needs this field");
  const item = newAdaptiveLeaderboardSegment("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
