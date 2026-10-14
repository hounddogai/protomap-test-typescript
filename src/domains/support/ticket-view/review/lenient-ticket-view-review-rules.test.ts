import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientTicketViewReviewPriorityRangeRule,
  LenientTicketViewReviewRequiredSourceRule,
  defaultLenientTicketViewReviewValidator,
} from "./lenient-ticket-view-review-rules.js";
import { newLenientTicketViewReview } from "./lenient-ticket-view-review.js";

test("LenientTicketViewReviewValidator reports every problem", () => {
  const validator = defaultLenientTicketViewReviewValidator();
  const item = newLenientTicketViewReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientTicketViewReviewRequiredSourceRule flags a blank source", () => {
  const rule = new LenientTicketViewReviewRequiredSourceRule("lenient ticket view review needs a value");
  const item = newLenientTicketViewReview("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientTicketViewReviewPriorityRangeRule flags values above priority", () => {
  const rule = new LenientTicketViewReviewPriorityRangeRule(32, 1000);
  const item = newLenientTicketViewReview("x", "y");
  item.priority = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
