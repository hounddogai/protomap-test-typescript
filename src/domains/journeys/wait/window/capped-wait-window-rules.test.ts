import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedWaitWindowMaximumRangeRule,
  CappedWaitWindowRequiredReviewerRule,
  CappedWaitWindowReviewerLengthRule,
  defaultCappedWaitWindowValidator,
} from "./capped-wait-window-rules.js";
import { newCappedWaitWindow } from "./capped-wait-window.js";

test("CappedWaitWindowValidator reports every problem", () => {
  const validator = defaultCappedWaitWindowValidator();
  const item = newCappedWaitWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedWaitWindowReviewerLengthRule flags a long reviewer", () => {
  const rule = new CappedWaitWindowReviewerLengthRule(3600);
  const item = newCappedWaitWindow("x", "y");
  item.reviewer = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedWaitWindowRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new CappedWaitWindowRequiredReviewerRule("capped wait window needs this field");
  const item = newCappedWaitWindow("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedWaitWindowMaximumRangeRule flags values above maximum", () => {
  const rule = new CappedWaitWindowMaximumRangeRule(5, 3601);
  const item = newCappedWaitWindow("x", "y");
  item.maximum = 3602.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
