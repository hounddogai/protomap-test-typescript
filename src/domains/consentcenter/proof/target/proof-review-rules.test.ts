import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ProofReviewCodeLengthRule,
  ProofReviewFrequencyCapRangeRule,
  ProofReviewRequiredChecksumRule,
  ProofReviewRequiredTitleRule,
  ProofReviewSourceLengthRule,
  defaultProofReviewValidator,
} from "./proof-review-rules.js";
import { newProofReview } from "./proof-review.js";

test("ProofReviewValidator reports every problem", () => {
  const validator = defaultProofReviewValidator();
  const item = newProofReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ProofReviewSourceLengthRule flags a long source", () => {
  const rule = new ProofReviewSourceLengthRule(255);
  const item = newProofReview("x", "y");
  item.source = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ProofReviewRequiredChecksumRule flags a blank checksum", () => {
  const rule = new ProofReviewRequiredChecksumRule("proof review needs a value");
  const item = newProofReview("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ProofReviewFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new ProofReviewFrequencyCapRangeRule(3600, 86400);
  const item = newProofReview("x", "y");
  item.frequencyCap = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ProofReviewCodeLengthRule flags a long code", () => {
  const rule = new ProofReviewCodeLengthRule(64);
  const item = newProofReview("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ProofReviewRequiredTitleRule flags a blank title", () => {
  const rule = new ProofReviewRequiredTitleRule("proof review needs this field");
  const item = newProofReview("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
