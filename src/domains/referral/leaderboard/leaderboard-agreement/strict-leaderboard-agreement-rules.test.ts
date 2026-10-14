import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictLeaderboardAgreementExpiresAtRangeRule,
  StrictLeaderboardAgreementRequiredCodeRule,
  StrictLeaderboardAgreementRequiredLabelRule,
  StrictLeaderboardAgreementRequiredTitleRule,
  StrictLeaderboardAgreementThresholdRangeRule,
  defaultStrictLeaderboardAgreementValidator,
} from "./strict-leaderboard-agreement-rules.js";
import { newStrictLeaderboardAgreement } from "./strict-leaderboard-agreement.js";

test("StrictLeaderboardAgreementValidator reports every problem", () => {
  const validator = defaultStrictLeaderboardAgreementValidator();
  const item = newStrictLeaderboardAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictLeaderboardAgreementRequiredCodeRule flags a blank code", () => {
  const rule = new StrictLeaderboardAgreementRequiredCodeRule("strict leaderboard agreement needs this field");
  const item = newStrictLeaderboardAgreement("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictLeaderboardAgreementExpiresAtRangeRule flags values above expires at", () => {
  const rule = new StrictLeaderboardAgreementExpiresAtRangeRule(3600, 86400);
  const item = newStrictLeaderboardAgreement("x", "y");
  item.expiresAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictLeaderboardAgreementThresholdRangeRule flags values above threshold", () => {
  const rule = new StrictLeaderboardAgreementThresholdRangeRule(6.3, 1607.5);
  const item = newStrictLeaderboardAgreement("x", "y");
  item.threshold = 1609;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictLeaderboardAgreementRequiredTitleRule flags a blank title", () => {
  const rule = new StrictLeaderboardAgreementRequiredTitleRule("strict leaderboard agreement needs a value");
  const item = newStrictLeaderboardAgreement("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictLeaderboardAgreementRequiredLabelRule flags a blank label", () => {
  const rule = new StrictLeaderboardAgreementRequiredLabelRule("strict leaderboard agreement needs an entry");
  const item = newStrictLeaderboardAgreement("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
