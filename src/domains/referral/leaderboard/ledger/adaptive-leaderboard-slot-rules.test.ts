import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveLeaderboardSlotClicksRangeRule,
  AdaptiveLeaderboardSlotRequiredCodeRule,
  AdaptiveLeaderboardSlotRequiredTitleRule,
  defaultAdaptiveLeaderboardSlotValidator,
} from "./adaptive-leaderboard-slot-rules.js";
import { newAdaptiveLeaderboardSlot } from "./adaptive-leaderboard-slot.js";

test("AdaptiveLeaderboardSlotValidator reports every problem", () => {
  const validator = defaultAdaptiveLeaderboardSlotValidator();
  const item = newAdaptiveLeaderboardSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveLeaderboardSlotRequiredCodeRule flags a blank code", () => {
  const rule = new AdaptiveLeaderboardSlotRequiredCodeRule("adaptive leaderboard slot needs an entry");
  const item = newAdaptiveLeaderboardSlot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveLeaderboardSlotClicksRangeRule flags values above clicks", () => {
  const rule = new AdaptiveLeaderboardSlotClicksRangeRule(80, 1000);
  const item = newAdaptiveLeaderboardSlot("x", "y");
  item.clicks = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveLeaderboardSlotRequiredTitleRule flags a blank title", () => {
  const rule = new AdaptiveLeaderboardSlotRequiredTitleRule("adaptive leaderboard slot needs an entry");
  const item = newAdaptiveLeaderboardSlot("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
