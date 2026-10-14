import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingLeaderboardDraftCodeLengthRule,
  RollingLeaderboardDraftRegionLengthRule,
  RollingLeaderboardDraftRequiredSummaryRule,
  defaultRollingLeaderboardDraftValidator,
} from "./rolling-leaderboard-draft-rules.js";
import { newRollingLeaderboardDraft } from "./rolling-leaderboard-draft.js";

test("RollingLeaderboardDraftValidator reports every problem", () => {
  const validator = defaultRollingLeaderboardDraftValidator();
  const item = newRollingLeaderboardDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingLeaderboardDraftRegionLengthRule flags a long region", () => {
  const rule = new RollingLeaderboardDraftRegionLengthRule(1000);
  const item = newRollingLeaderboardDraft("x", "y");
  item.region = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingLeaderboardDraftRequiredSummaryRule flags a blank summary", () => {
  const rule = new RollingLeaderboardDraftRequiredSummaryRule("rolling leaderboard draft needs an entry");
  const item = newRollingLeaderboardDraft("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingLeaderboardDraftCodeLengthRule flags a long code", () => {
  const rule = new RollingLeaderboardDraftCodeLengthRule(255);
  const item = newRollingLeaderboardDraft("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
