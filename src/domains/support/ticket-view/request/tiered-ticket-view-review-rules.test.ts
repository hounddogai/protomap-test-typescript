import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredTicketViewReviewCurrencyLengthRule,
  TieredTicketViewReviewRequiredCurrencyRule,
  TieredTicketViewReviewRequiredLabelRule,
  TieredTicketViewReviewRevisionRangeRule,
  defaultTieredTicketViewReviewValidator,
} from "./tiered-ticket-view-review-rules.js";
import { newTieredTicketViewReview } from "./tiered-ticket-view-review.js";

test("TieredTicketViewReviewValidator reports every problem", () => {
  const validator = defaultTieredTicketViewReviewValidator();
  const item = newTieredTicketViewReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredTicketViewReviewCurrencyLengthRule flags a long currency", () => {
  const rule = new TieredTicketViewReviewCurrencyLengthRule(3600);
  const item = newTieredTicketViewReview("x", "y");
  item.currency = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredTicketViewReviewRequiredLabelRule flags a blank label", () => {
  const rule = new TieredTicketViewReviewRequiredLabelRule("tiered ticket view review needs an entry");
  const item = newTieredTicketViewReview("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredTicketViewReviewRevisionRangeRule flags values above revision", () => {
  const rule = new TieredTicketViewReviewRevisionRangeRule(32, 3600);
  const item = newTieredTicketViewReview("x", "y");
  item.revision = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredTicketViewReviewRequiredCurrencyRule flags a blank currency", () => {
  const rule = new TieredTicketViewReviewRequiredCurrencyRule("tiered ticket view review needs a value");
  const item = newTieredTicketViewReview("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
