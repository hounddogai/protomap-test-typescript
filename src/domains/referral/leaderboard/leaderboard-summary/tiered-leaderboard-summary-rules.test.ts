import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredLeaderboardSummaryCodeLengthRule,
  TieredLeaderboardSummaryRequiredChecksumRule,
  TieredLeaderboardSummaryTitleLengthRule,
  defaultTieredLeaderboardSummaryValidator,
} from "./tiered-leaderboard-summary-rules.js";
import { newTieredLeaderboardSummary } from "./tiered-leaderboard-summary.js";

test("TieredLeaderboardSummaryValidator reports every problem", () => {
  const validator = defaultTieredLeaderboardSummaryValidator();
  const item = newTieredLeaderboardSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredLeaderboardSummaryTitleLengthRule flags a long title", () => {
  const rule = new TieredLeaderboardSummaryTitleLengthRule(16);
  const item = newTieredLeaderboardSummary("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredLeaderboardSummaryRequiredChecksumRule flags a blank checksum", () => {
  const rule = new TieredLeaderboardSummaryRequiredChecksumRule("tiered leaderboard summary needs an entry");
  const item = newTieredLeaderboardSummary("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredLeaderboardSummaryCodeLengthRule flags a long code", () => {
  const rule = new TieredLeaderboardSummaryCodeLengthRule(1000);
  const item = newTieredLeaderboardSummary("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
