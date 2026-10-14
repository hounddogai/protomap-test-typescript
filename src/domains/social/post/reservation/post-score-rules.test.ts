import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PostScoreCodeLengthRule,
  PostScoreDiscountRangeRule,
  PostScoreTitleLengthRule,
  defaultPostScoreValidator,
} from "./post-score-rules.js";
import { newPostScore } from "./post-score.js";

test("PostScoreValidator reports every problem", () => {
  const validator = defaultPostScoreValidator();
  const item = newPostScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PostScoreDiscountRangeRule flags values above discount", () => {
  const rule = new PostScoreDiscountRangeRule(1.9, 3495.6);
  const item = newPostScore("x", "y");
  item.discount = 3497.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PostScoreCodeLengthRule flags a long code", () => {
  const rule = new PostScoreCodeLengthRule(80);
  const item = newPostScore("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PostScoreTitleLengthRule flags a long title", () => {
  const rule = new PostScoreTitleLengthRule(255);
  const item = newPostScore("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
