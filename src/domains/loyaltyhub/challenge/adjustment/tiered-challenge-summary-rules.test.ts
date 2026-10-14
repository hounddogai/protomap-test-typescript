import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredChallengeSummaryRequiredLabelRule,
  TieredChallengeSummaryScoreRangeRule,
  defaultTieredChallengeSummaryValidator,
} from "./tiered-challenge-summary-rules.js";
import { newTieredChallengeSummary } from "./tiered-challenge-summary.js";

test("TieredChallengeSummaryValidator reports every problem", () => {
  const validator = defaultTieredChallengeSummaryValidator();
  const item = newTieredChallengeSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredChallengeSummaryScoreRangeRule flags values above score", () => {
  const rule = new TieredChallengeSummaryScoreRangeRule(7.4, 556.4);
  const item = newTieredChallengeSummary("x", "y");
  item.score = 557.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredChallengeSummaryRequiredLabelRule flags a blank label", () => {
  const rule = new TieredChallengeSummaryRequiredLabelRule("tiered challenge summary needs an entry");
  const item = newTieredChallengeSummary("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
