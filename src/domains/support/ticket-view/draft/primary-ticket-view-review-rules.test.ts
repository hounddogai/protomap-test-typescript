import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryTicketViewReviewFloorValueRangeRule,
  PrimaryTicketViewReviewRequiredExternalRefRule,
  PrimaryTicketViewReviewWindowDaysRangeRule,
  defaultPrimaryTicketViewReviewValidator,
} from "./primary-ticket-view-review-rules.js";
import { newPrimaryTicketViewReview } from "./primary-ticket-view-review.js";

test("PrimaryTicketViewReviewValidator reports every problem", () => {
  const validator = defaultPrimaryTicketViewReviewValidator();
  const item = newPrimaryTicketViewReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryTicketViewReviewRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new PrimaryTicketViewReviewRequiredExternalRefRule("primary ticket view review needs this field");
  const item = newPrimaryTicketViewReview("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryTicketViewReviewWindowDaysRangeRule flags values above window days", () => {
  const rule = new PrimaryTicketViewReviewWindowDaysRangeRule(255, 255);
  const item = newPrimaryTicketViewReview("x", "y");
  item.windowDays = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryTicketViewReviewFloorValueRangeRule flags values above floor value", () => {
  const rule = new PrimaryTicketViewReviewFloorValueRangeRule(9.2, 1365.5);
  const item = newPrimaryTicketViewReview("x", "y");
  item.floorValue = 1367;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
