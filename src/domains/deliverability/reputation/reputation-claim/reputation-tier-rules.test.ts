import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ReputationTierCodeLengthRule,
  ReputationTierDurationMinutesRangeRule,
  ReputationTierRequiredCodeRule,
  ReputationTierRequiredCohortRule,
  ReputationTierTitleLengthRule,
  defaultReputationTierValidator,
} from "./reputation-tier-rules.js";
import { newReputationTier } from "./reputation-tier.js";

test("ReputationTierValidator reports every problem", () => {
  const validator = defaultReputationTierValidator();
  const item = newReputationTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ReputationTierDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new ReputationTierDurationMinutesRangeRule(1000, 3600);
  const item = newReputationTier("x", "y");
  item.durationMinutes = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ReputationTierTitleLengthRule flags a long title", () => {
  const rule = new ReputationTierTitleLengthRule(32);
  const item = newReputationTier("x", "y");
  item.title = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ReputationTierRequiredCodeRule flags a blank code", () => {
  const rule = new ReputationTierRequiredCodeRule("reputation tier needs this field");
  const item = newReputationTier("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReputationTierCodeLengthRule flags a long code", () => {
  const rule = new ReputationTierCodeLengthRule(80);
  const item = newReputationTier("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ReputationTierRequiredCohortRule flags a blank cohort", () => {
  const rule = new ReputationTierRequiredCohortRule("reputation tier needs a value");
  const item = newReputationTier("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
