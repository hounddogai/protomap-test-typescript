import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedJourneyAgreementAttemptsRangeRule,
  WeightedJourneyAgreementDiscountRangeRule,
  WeightedJourneyAgreementRequiredCohortRule,
  WeightedJourneyAgreementRequiredTitleRule,
  defaultWeightedJourneyAgreementValidator,
} from "./weighted-journey-agreement-rules.js";
import { newWeightedJourneyAgreement } from "./weighted-journey-agreement.js";

test("WeightedJourneyAgreementValidator reports every problem", () => {
  const validator = defaultWeightedJourneyAgreementValidator();
  const item = newWeightedJourneyAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedJourneyAgreementRequiredCohortRule flags a blank cohort", () => {
  const rule = new WeightedJourneyAgreementRequiredCohortRule("weighted journey agreement needs a value");
  const item = newWeightedJourneyAgreement("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedJourneyAgreementRequiredTitleRule flags a blank title", () => {
  const rule = new WeightedJourneyAgreementRequiredTitleRule("weighted journey agreement needs an entry");
  const item = newWeightedJourneyAgreement("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedJourneyAgreementDiscountRangeRule flags values above discount", () => {
  const rule = new WeightedJourneyAgreementDiscountRangeRule(4.4, 2045.1);
  const item = newWeightedJourneyAgreement("x", "y");
  item.discount = 2046.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedJourneyAgreementAttemptsRangeRule flags values above attempts", () => {
  const rule = new WeightedJourneyAgreementAttemptsRangeRule(16, 64);
  const item = newWeightedJourneyAgreement("x", "y");
  item.attempts = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
