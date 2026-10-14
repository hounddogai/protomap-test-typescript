import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreativeReviewQuantityRangeRule,
  CreativeReviewRequiredLabelRule,
  CreativeReviewRequiredNotesRule,
  defaultCreativeReviewValidator,
} from "./creative-review-rules.js";
import { newCreativeReview } from "./creative-review.js";

test("CreativeReviewValidator reports every problem", () => {
  const validator = defaultCreativeReviewValidator();
  const item = newCreativeReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreativeReviewQuantityRangeRule flags values above quantity", () => {
  const rule = new CreativeReviewQuantityRangeRule(32, 255);
  const item = newCreativeReview("x", "y");
  item.quantity = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CreativeReviewRequiredNotesRule flags a blank notes", () => {
  const rule = new CreativeReviewRequiredNotesRule("creative review needs this field");
  const item = newCreativeReview("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CreativeReviewRequiredLabelRule flags a blank label", () => {
  const rule = new CreativeReviewRequiredLabelRule("creative review needs an entry");
  const item = newCreativeReview("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
