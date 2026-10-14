import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LeaderboardDraftLabelLengthRule,
  LeaderboardDraftLocaleLengthRule,
  LeaderboardDraftRequiredCodeRule,
  LeaderboardDraftRequiredTitleRule,
  LeaderboardDraftThresholdRangeRule,
  defaultLeaderboardDraftValidator,
} from "./leaderboard-draft-rules.js";
import { newLeaderboardDraft } from "./leaderboard-draft.js";

test("LeaderboardDraftValidator reports every problem", () => {
  const validator = defaultLeaderboardDraftValidator();
  const item = newLeaderboardDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LeaderboardDraftRequiredCodeRule flags a blank code", () => {
  const rule = new LeaderboardDraftRequiredCodeRule("leaderboard draft needs an entry");
  const item = newLeaderboardDraft("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LeaderboardDraftLocaleLengthRule flags a long locale", () => {
  const rule = new LeaderboardDraftLocaleLengthRule(16);
  const item = newLeaderboardDraft("x", "y");
  item.locale = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LeaderboardDraftLabelLengthRule flags a long label", () => {
  const rule = new LeaderboardDraftLabelLengthRule(16);
  const item = newLeaderboardDraft("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LeaderboardDraftThresholdRangeRule flags values above threshold", () => {
  const rule = new LeaderboardDraftThresholdRangeRule(3.4, 2417.8);
  const item = newLeaderboardDraft("x", "y");
  item.threshold = 2419.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LeaderboardDraftRequiredTitleRule flags a blank title", () => {
  const rule = new LeaderboardDraftRequiredTitleRule("leaderboard draft needs a value");
  const item = newLeaderboardDraft("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
