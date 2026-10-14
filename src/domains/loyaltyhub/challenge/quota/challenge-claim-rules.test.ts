import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ChallengeClaimCountryLengthRule,
  ChallengeClaimDiscountRangeRule,
  ChallengeClaimLabelLengthRule,
  ChallengeClaimRequiredCountryRule,
  ChallengeClaimRequiredLabelRule,
  defaultChallengeClaimValidator,
} from "./challenge-claim-rules.js";
import { newChallengeClaim } from "./challenge-claim.js";

test("ChallengeClaimValidator reports every problem", () => {
  const validator = defaultChallengeClaimValidator();
  const item = newChallengeClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ChallengeClaimRequiredLabelRule flags a blank label", () => {
  const rule = new ChallengeClaimRequiredLabelRule("challenge claim needs a value");
  const item = newChallengeClaim("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ChallengeClaimCountryLengthRule flags a long country", () => {
  const rule = new ChallengeClaimCountryLengthRule(80);
  const item = newChallengeClaim("x", "y");
  item.country = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ChallengeClaimLabelLengthRule flags a long label", () => {
  const rule = new ChallengeClaimLabelLengthRule(255);
  const item = newChallengeClaim("x", "y");
  item.label = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ChallengeClaimDiscountRangeRule flags values above discount", () => {
  const rule = new ChallengeClaimDiscountRangeRule(3.5, 1879.7);
  const item = newChallengeClaim("x", "y");
  item.discount = 1881.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ChallengeClaimRequiredCountryRule flags a blank country", () => {
  const rule = new ChallengeClaimRequiredCountryRule("challenge claim needs a value");
  const item = newChallengeClaim("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
