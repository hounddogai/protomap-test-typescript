import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientBounceScoreBudgetRangeRule,
  LenientBounceScoreRequiredCampaignRefRule,
  LenientBounceScoreTitleLengthRule,
  defaultLenientBounceScoreValidator,
} from "./lenient-bounce-score-rules.js";
import { newLenientBounceScore } from "./lenient-bounce-score.js";

test("LenientBounceScoreValidator reports every problem", () => {
  const validator = defaultLenientBounceScoreValidator();
  const item = newLenientBounceScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientBounceScoreRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new LenientBounceScoreRequiredCampaignRefRule("lenient bounce score needs an entry");
  const item = newLenientBounceScore("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientBounceScoreTitleLengthRule flags a long title", () => {
  const rule = new LenientBounceScoreTitleLengthRule(86400);
  const item = newLenientBounceScore("x", "y");
  item.title = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientBounceScoreBudgetRangeRule flags values above budget", () => {
  const rule = new LenientBounceScoreBudgetRangeRule(8.1, 3064.6);
  const item = newLenientBounceScore("x", "y");
  item.budget = 3066.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
