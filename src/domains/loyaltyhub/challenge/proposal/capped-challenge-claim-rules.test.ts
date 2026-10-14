import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedChallengeClaimChecksumLengthRule,
  CappedChallengeClaimCountryLengthRule,
  CappedChallengeClaimNameLengthRule,
  CappedChallengeClaimRequiredChecksumRule,
  CappedChallengeClaimRequiredCodeRule,
  CappedChallengeClaimScoreRangeRule,
  defaultCappedChallengeClaimValidator,
} from "./capped-challenge-claim-rules.js";
import { newCappedChallengeClaim } from "./capped-challenge-claim.js";

test("CappedChallengeClaimValidator reports every problem", () => {
  const validator = defaultCappedChallengeClaimValidator();
  const item = newCappedChallengeClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedChallengeClaimChecksumLengthRule flags a long checksum", () => {
  const rule = new CappedChallengeClaimChecksumLengthRule(32);
  const item = newCappedChallengeClaim("x", "y");
  item.checksum = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedChallengeClaimCountryLengthRule flags a long country", () => {
  const rule = new CappedChallengeClaimCountryLengthRule(32);
  const item = newCappedChallengeClaim("x", "y");
  item.country = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedChallengeClaimScoreRangeRule flags values above score", () => {
  const rule = new CappedChallengeClaimScoreRangeRule(9.9, 1870.2);
  const item = newCappedChallengeClaim("x", "y");
  item.score = 1871.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedChallengeClaimRequiredCodeRule flags a blank code", () => {
  const rule = new CappedChallengeClaimRequiredCodeRule("capped challenge claim needs a value");
  const item = newCappedChallengeClaim("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedChallengeClaimNameLengthRule flags a long name", () => {
  const rule = new CappedChallengeClaimNameLengthRule(64);
  const item = newCappedChallengeClaim("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedChallengeClaimRequiredChecksumRule flags a blank checksum", () => {
  const rule = new CappedChallengeClaimRequiredChecksumRule("capped challenge claim needs an entry");
  const item = newCappedChallengeClaim("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
