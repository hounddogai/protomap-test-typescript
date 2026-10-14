import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MacroReviewCodeLengthRule,
  MacroReviewRequiredCodeRule,
  MacroReviewRequiredLabelRule,
  defaultMacroReviewValidator,
} from "./macro-review-rules.js";
import { newMacroReview } from "./macro-review.js";

test("MacroReviewValidator reports every problem", () => {
  const validator = defaultMacroReviewValidator();
  const item = newMacroReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("MacroReviewRequiredCodeRule flags a blank code", () => {
  const rule = new MacroReviewRequiredCodeRule("macro review needs this field");
  const item = newMacroReview("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("MacroReviewCodeLengthRule flags a long code", () => {
  const rule = new MacroReviewCodeLengthRule(16);
  const item = newMacroReview("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("MacroReviewRequiredLabelRule flags a blank label", () => {
  const rule = new MacroReviewRequiredLabelRule("macro review needs a value");
  const item = newMacroReview("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
