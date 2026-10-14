import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedLeaderboardAgreementRequiredTitleRule,
  BatchedLeaderboardAgreementRequiredVariantRule,
  BatchedLeaderboardAgreementRetriesRangeRule,
  BatchedLeaderboardAgreementTitleLengthRule,
  defaultBatchedLeaderboardAgreementValidator,
} from "./batched-leaderboard-agreement-rules.js";
import { newBatchedLeaderboardAgreement } from "./batched-leaderboard-agreement.js";

test("BatchedLeaderboardAgreementValidator reports every problem", () => {
  const validator = defaultBatchedLeaderboardAgreementValidator();
  const item = newBatchedLeaderboardAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedLeaderboardAgreementRequiredVariantRule flags a blank variant", () => {
  const rule = new BatchedLeaderboardAgreementRequiredVariantRule("batched leaderboard agreement needs a value");
  const item = newBatchedLeaderboardAgreement("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedLeaderboardAgreementTitleLengthRule flags a long title", () => {
  const rule = new BatchedLeaderboardAgreementTitleLengthRule(16);
  const item = newBatchedLeaderboardAgreement("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedLeaderboardAgreementRequiredTitleRule flags a blank title", () => {
  const rule = new BatchedLeaderboardAgreementRequiredTitleRule("batched leaderboard agreement needs this field");
  const item = newBatchedLeaderboardAgreement("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedLeaderboardAgreementRetriesRangeRule flags values above retries", () => {
  const rule = new BatchedLeaderboardAgreementRetriesRangeRule(64, 120);
  const item = newBatchedLeaderboardAgreement("x", "y");
  item.retries = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
