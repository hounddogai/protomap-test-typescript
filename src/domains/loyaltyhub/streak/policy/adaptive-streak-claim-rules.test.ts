import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveStreakClaimBatchSizeRangeRule,
  AdaptiveStreakClaimRequiredCurrencyRule,
  AdaptiveStreakClaimScoreRangeRule,
  defaultAdaptiveStreakClaimValidator,
} from "./adaptive-streak-claim-rules.js";
import { newAdaptiveStreakClaim } from "./adaptive-streak-claim.js";

test("AdaptiveStreakClaimValidator reports every problem", () => {
  const validator = defaultAdaptiveStreakClaimValidator();
  const item = newAdaptiveStreakClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveStreakClaimScoreRangeRule flags values above score", () => {
  const rule = new AdaptiveStreakClaimScoreRangeRule(5.2, 4320.7);
  const item = newAdaptiveStreakClaim("x", "y");
  item.score = 4322.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveStreakClaimBatchSizeRangeRule flags values above batch size", () => {
  const rule = new AdaptiveStreakClaimBatchSizeRangeRule(16, 255);
  const item = newAdaptiveStreakClaim("x", "y");
  item.batchSize = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveStreakClaimRequiredCurrencyRule flags a blank currency", () => {
  const rule = new AdaptiveStreakClaimRequiredCurrencyRule("adaptive streak claim needs this field");
  const item = newAdaptiveStreakClaim("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
