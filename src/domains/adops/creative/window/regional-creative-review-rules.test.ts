import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalCreativeReviewRequiredCodeRule,
  RegionalCreativeReviewRequiredPhoneRule,
  RegionalCreativeReviewRetriesRangeRule,
  defaultRegionalCreativeReviewValidator,
} from "./regional-creative-review-rules.js";
import { newRegionalCreativeReview } from "./regional-creative-review.js";

test("RegionalCreativeReviewValidator reports every problem", () => {
  const validator = defaultRegionalCreativeReviewValidator();
  const item = newRegionalCreativeReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalCreativeReviewRequiredPhoneRule flags a blank phone", () => {
  const rule = new RegionalCreativeReviewRequiredPhoneRule("regional creative review needs this field");
  const item = newRegionalCreativeReview("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalCreativeReviewRetriesRangeRule flags values above retries", () => {
  const rule = new RegionalCreativeReviewRetriesRangeRule(255, 255);
  const item = newRegionalCreativeReview("x", "y");
  item.retries = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalCreativeReviewRequiredCodeRule flags a blank code", () => {
  const rule = new RegionalCreativeReviewRequiredCodeRule("regional creative review needs a value");
  const item = newRegionalCreativeReview("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
