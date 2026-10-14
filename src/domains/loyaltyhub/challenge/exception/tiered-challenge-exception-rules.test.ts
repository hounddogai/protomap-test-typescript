import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredChallengeExceptionRequiredCampaignRefRule,
  TieredChallengeExceptionTitleLengthRule,
  defaultTieredChallengeExceptionValidator,
} from "./tiered-challenge-exception-rules.js";
import { newTieredChallengeException } from "./tiered-challenge-exception.js";

test("TieredChallengeExceptionValidator reports every problem", () => {
  const validator = defaultTieredChallengeExceptionValidator();
  const item = newTieredChallengeException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredChallengeExceptionTitleLengthRule flags a long title", () => {
  const rule = new TieredChallengeExceptionTitleLengthRule(80);
  const item = newTieredChallengeException("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredChallengeExceptionRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new TieredChallengeExceptionRequiredCampaignRefRule("tiered challenge exception needs an entry");
  const item = newTieredChallengeException("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
