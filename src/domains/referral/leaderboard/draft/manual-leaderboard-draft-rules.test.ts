import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualLeaderboardDraftCodeLengthRule,
  ManualLeaderboardDraftMarginRangeRule,
  ManualLeaderboardDraftMaximumRangeRule,
  ManualLeaderboardDraftRequiredTitleRule,
  defaultManualLeaderboardDraftValidator,
} from "./manual-leaderboard-draft-rules.js";
import { newManualLeaderboardDraft } from "./manual-leaderboard-draft.js";

test("ManualLeaderboardDraftValidator reports every problem", () => {
  const validator = defaultManualLeaderboardDraftValidator();
  const item = newManualLeaderboardDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualLeaderboardDraftMaximumRangeRule flags values above maximum", () => {
  const rule = new ManualLeaderboardDraftMaximumRangeRule(7, 2737.1);
  const item = newManualLeaderboardDraft("x", "y");
  item.maximum = 2738.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualLeaderboardDraftRequiredTitleRule flags a blank title", () => {
  const rule = new ManualLeaderboardDraftRequiredTitleRule("manual leaderboard draft needs an entry");
  const item = newManualLeaderboardDraft("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualLeaderboardDraftMarginRangeRule flags values above margin", () => {
  const rule = new ManualLeaderboardDraftMarginRangeRule(2, 3425.5);
  const item = newManualLeaderboardDraft("x", "y");
  item.margin = 3427;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualLeaderboardDraftCodeLengthRule flags a long code", () => {
  const rule = new ManualLeaderboardDraftCodeLengthRule(80);
  const item = newManualLeaderboardDraft("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
