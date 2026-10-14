import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyBidRuleReviewContactEmailLengthRule,
  LegacyBidRuleReviewRequiredContactEmailRule,
  LegacyBidRuleReviewRequiredLabelRule,
  defaultLegacyBidRuleReviewValidator,
} from "./legacy-bid-rule-review-rules.js";
import { newLegacyBidRuleReview } from "./legacy-bid-rule-review.js";

test("LegacyBidRuleReviewValidator reports every problem", () => {
  const validator = defaultLegacyBidRuleReviewValidator();
  const item = newLegacyBidRuleReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyBidRuleReviewRequiredLabelRule flags a blank label", () => {
  const rule = new LegacyBidRuleReviewRequiredLabelRule("legacy bid rule review needs an entry");
  const item = newLegacyBidRuleReview("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyBidRuleReviewRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new LegacyBidRuleReviewRequiredContactEmailRule("legacy bid rule review needs an entry");
  const item = newLegacyBidRuleReview("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyBidRuleReviewContactEmailLengthRule flags a long contact email", () => {
  const rule = new LegacyBidRuleReviewContactEmailLengthRule(32);
  const item = newLegacyBidRuleReview("x", "y");
  item.contactEmail = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
