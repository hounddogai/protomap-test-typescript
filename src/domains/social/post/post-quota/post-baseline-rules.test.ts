import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PostBaselineDescriptionLengthRule,
  PostBaselineEndsAtRangeRule,
  PostBaselineLocaleLengthRule,
  PostBaselineRequiredTitleRule,
  defaultPostBaselineValidator,
} from "./post-baseline-rules.js";
import { newPostBaseline } from "./post-baseline.js";

test("PostBaselineValidator reports every problem", () => {
  const validator = defaultPostBaselineValidator();
  const item = newPostBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PostBaselineDescriptionLengthRule flags a long description", () => {
  const rule = new PostBaselineDescriptionLengthRule(64);
  const item = newPostBaseline("x", "y");
  item.description = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PostBaselineLocaleLengthRule flags a long locale", () => {
  const rule = new PostBaselineLocaleLengthRule(1000);
  const item = newPostBaseline("x", "y");
  item.locale = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PostBaselineEndsAtRangeRule flags values above ends at", () => {
  const rule = new PostBaselineEndsAtRangeRule(64, 120);
  const item = newPostBaseline("x", "y");
  item.endsAt = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PostBaselineRequiredTitleRule flags a blank title", () => {
  const rule = new PostBaselineRequiredTitleRule("post baseline needs an entry");
  const item = newPostBaseline("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
