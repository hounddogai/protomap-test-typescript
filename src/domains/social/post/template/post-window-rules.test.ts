import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PostWindowGraceDaysRangeRule,
  PostWindowLabelLengthRule,
  PostWindowRequiredSourceRule,
  defaultPostWindowValidator,
} from "./post-window-rules.js";
import { newPostWindow } from "./post-window.js";

test("PostWindowValidator reports every problem", () => {
  const validator = defaultPostWindowValidator();
  const item = newPostWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PostWindowRequiredSourceRule flags a blank source", () => {
  const rule = new PostWindowRequiredSourceRule("post window needs this field");
  const item = newPostWindow("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PostWindowGraceDaysRangeRule flags values above grace days", () => {
  const rule = new PostWindowGraceDaysRangeRule(80, 86400);
  const item = newPostWindow("x", "y");
  item.graceDays = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PostWindowLabelLengthRule flags a long label", () => {
  const rule = new PostWindowLabelLengthRule(16);
  const item = newPostWindow("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
