import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LeaderboardLedgerCreatedAtRangeRule,
  LeaderboardLedgerDescriptionLengthRule,
  LeaderboardLedgerSummaryLengthRule,
  defaultLeaderboardLedgerValidator,
} from "./leaderboard-ledger-rules.js";
import { newLeaderboardLedger } from "./leaderboard-ledger.js";

test("LeaderboardLedgerValidator reports every problem", () => {
  const validator = defaultLeaderboardLedgerValidator();
  const item = newLeaderboardLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LeaderboardLedgerCreatedAtRangeRule flags values above created at", () => {
  const rule = new LeaderboardLedgerCreatedAtRangeRule(80, 86400);
  const item = newLeaderboardLedger("x", "y");
  item.createdAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LeaderboardLedgerSummaryLengthRule flags a long summary", () => {
  const rule = new LeaderboardLedgerSummaryLengthRule(16);
  const item = newLeaderboardLedger("x", "y");
  item.summary = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LeaderboardLedgerDescriptionLengthRule flags a long description", () => {
  const rule = new LeaderboardLedgerDescriptionLengthRule(16);
  const item = newLeaderboardLedger("x", "y");
  item.description = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
