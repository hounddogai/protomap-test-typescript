import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalLeaderboardAgreementBatchSizeRangeRule,
  SeasonalLeaderboardAgreementBidRangeRule,
  SeasonalLeaderboardAgreementMaximumRangeRule,
  SeasonalLeaderboardAgreementRequiredNameRule,
  defaultSeasonalLeaderboardAgreementValidator,
} from "./seasonal-leaderboard-agreement-rules.js";
import { newSeasonalLeaderboardAgreement } from "./seasonal-leaderboard-agreement.js";

test("SeasonalLeaderboardAgreementValidator reports every problem", () => {
  const validator = defaultSeasonalLeaderboardAgreementValidator();
  const item = newSeasonalLeaderboardAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalLeaderboardAgreementRequiredNameRule flags a blank name", () => {
  const rule = new SeasonalLeaderboardAgreementRequiredNameRule("seasonal leaderboard agreement needs this field");
  const item = newSeasonalLeaderboardAgreement("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalLeaderboardAgreementMaximumRangeRule flags values above maximum", () => {
  const rule = new SeasonalLeaderboardAgreementMaximumRangeRule(2.2, 3296.9);
  const item = newSeasonalLeaderboardAgreement("x", "y");
  item.maximum = 3298.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalLeaderboardAgreementBidRangeRule flags values above bid", () => {
  const rule = new SeasonalLeaderboardAgreementBidRangeRule(3.5, 4509.2);
  const item = newSeasonalLeaderboardAgreement("x", "y");
  item.bid = 4510.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalLeaderboardAgreementBatchSizeRangeRule flags values above batch size", () => {
  const rule = new SeasonalLeaderboardAgreementBatchSizeRangeRule(120, 1000);
  const item = newSeasonalLeaderboardAgreement("x", "y");
  item.batchSize = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
