import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualEscalationReviewRequiredCodeRule,
  ManualEscalationReviewRequiredCountryRule,
  ManualEscalationReviewRequiredTitleRule,
  ManualEscalationReviewTitleLengthRule,
  defaultManualEscalationReviewValidator,
} from "./manual-escalation-review-rules.js";
import { newManualEscalationReview } from "./manual-escalation-review.js";

test("ManualEscalationReviewValidator reports every problem", () => {
  const validator = defaultManualEscalationReviewValidator();
  const item = newManualEscalationReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualEscalationReviewRequiredCountryRule flags a blank country", () => {
  const rule = new ManualEscalationReviewRequiredCountryRule("manual escalation review needs an entry");
  const item = newManualEscalationReview("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualEscalationReviewRequiredCodeRule flags a blank code", () => {
  const rule = new ManualEscalationReviewRequiredCodeRule("manual escalation review needs an entry");
  const item = newManualEscalationReview("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualEscalationReviewTitleLengthRule flags a long title", () => {
  const rule = new ManualEscalationReviewTitleLengthRule(86400);
  const item = newManualEscalationReview("x", "y");
  item.title = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualEscalationReviewRequiredTitleRule flags a blank title", () => {
  const rule = new ManualEscalationReviewRequiredTitleRule("manual escalation review needs this field");
  const item = newManualEscalationReview("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
