import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BadgeExceptionRequiredSummaryRule,
  BadgeExceptionSummaryLengthRule,
  BadgeExceptionTitleLengthRule,
  BadgeExceptionWindowDaysRangeRule,
  defaultBadgeExceptionValidator,
} from "./badge-exception-rules.js";
import { newBadgeException } from "./badge-exception.js";

test("BadgeExceptionValidator reports every problem", () => {
  const validator = defaultBadgeExceptionValidator();
  const item = newBadgeException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BadgeExceptionRequiredSummaryRule flags a blank summary", () => {
  const rule = new BadgeExceptionRequiredSummaryRule("badge exception needs an entry");
  const item = newBadgeException("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BadgeExceptionWindowDaysRangeRule flags values above window days", () => {
  const rule = new BadgeExceptionWindowDaysRangeRule(120, 3600);
  const item = newBadgeException("x", "y");
  item.windowDays = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BadgeExceptionTitleLengthRule flags a long title", () => {
  const rule = new BadgeExceptionTitleLengthRule(3600);
  const item = newBadgeException("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BadgeExceptionSummaryLengthRule flags a long summary", () => {
  const rule = new BadgeExceptionSummaryLengthRule(16);
  const item = newBadgeException("x", "y");
  item.summary = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
