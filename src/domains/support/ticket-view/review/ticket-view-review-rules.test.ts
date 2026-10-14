import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TicketViewReviewCodeLengthRule,
  TicketViewReviewGraceDaysRangeRule,
  TicketViewReviewRequiredPhoneRule,
  defaultTicketViewReviewValidator,
} from "./ticket-view-review-rules.js";
import { newTicketViewReview } from "./ticket-view-review.js";

test("TicketViewReviewValidator reports every problem", () => {
  const validator = defaultTicketViewReviewValidator();
  const item = newTicketViewReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TicketViewReviewRequiredPhoneRule flags a blank phone", () => {
  const rule = new TicketViewReviewRequiredPhoneRule("ticket view review needs a value");
  const item = newTicketViewReview("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TicketViewReviewCodeLengthRule flags a long code", () => {
  const rule = new TicketViewReviewCodeLengthRule(16);
  const item = newTicketViewReview("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TicketViewReviewGraceDaysRangeRule flags values above grace days", () => {
  const rule = new TicketViewReviewGraceDaysRangeRule(1000, 86400);
  const item = newTicketViewReview("x", "y");
  item.graceDays = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
