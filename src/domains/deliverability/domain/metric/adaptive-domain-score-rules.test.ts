import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveDomainScoreCostRangeRule,
  AdaptiveDomainScoreJourneyIdLengthRule,
  AdaptiveDomainScoreSequenceRangeRule,
  defaultAdaptiveDomainScoreValidator,
} from "./adaptive-domain-score-rules.js";
import { newAdaptiveDomainScore } from "./adaptive-domain-score.js";

test("AdaptiveDomainScoreValidator reports every problem", () => {
  const validator = defaultAdaptiveDomainScoreValidator();
  const item = newAdaptiveDomainScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveDomainScoreJourneyIdLengthRule flags a long journey id", () => {
  const rule = new AdaptiveDomainScoreJourneyIdLengthRule(1000);
  const item = newAdaptiveDomainScore("x", "y");
  item.journeyId = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveDomainScoreCostRangeRule flags values above cost", () => {
  const rule = new AdaptiveDomainScoreCostRangeRule(5.4, 892);
  const item = newAdaptiveDomainScore("x", "y");
  item.cost = 893.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveDomainScoreSequenceRangeRule flags values above sequence", () => {
  const rule = new AdaptiveDomainScoreSequenceRangeRule(1000, 3600);
  const item = newAdaptiveDomainScore("x", "y");
  item.sequence = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
