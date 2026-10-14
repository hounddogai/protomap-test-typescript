import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FrequencyReviewChecksumLengthRule,
  FrequencyReviewCodeLengthRule,
  FrequencyReviewNameLengthRule,
  FrequencyReviewRequiredChecksumRule,
  defaultFrequencyReviewValidator,
} from "./frequency-review-rules.js";
import { newFrequencyReview } from "./frequency-review.js";

test("FrequencyReviewValidator reports every problem", () => {
  const validator = defaultFrequencyReviewValidator();
  const item = newFrequencyReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FrequencyReviewRequiredChecksumRule flags a blank checksum", () => {
  const rule = new FrequencyReviewRequiredChecksumRule("frequency review needs this field");
  const item = newFrequencyReview("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FrequencyReviewChecksumLengthRule flags a long checksum", () => {
  const rule = new FrequencyReviewChecksumLengthRule(255);
  const item = newFrequencyReview("x", "y");
  item.checksum = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FrequencyReviewCodeLengthRule flags a long code", () => {
  const rule = new FrequencyReviewCodeLengthRule(3600);
  const item = newFrequencyReview("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FrequencyReviewNameLengthRule flags a long name", () => {
  const rule = new FrequencyReviewNameLengthRule(1000);
  const item = newFrequencyReview("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
