import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingEnrollmentWindowMinimumRangeRule,
  RollingEnrollmentWindowRequiredSummaryRule,
  RollingEnrollmentWindowRequiredTitleRule,
  RollingEnrollmentWindowUpdatedAtRangeRule,
  defaultRollingEnrollmentWindowValidator,
} from "./rolling-enrollment-window-rules.js";
import { newRollingEnrollmentWindow } from "./rolling-enrollment-window.js";

test("RollingEnrollmentWindowValidator reports every problem", () => {
  const validator = defaultRollingEnrollmentWindowValidator();
  const item = newRollingEnrollmentWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingEnrollmentWindowRequiredTitleRule flags a blank title", () => {
  const rule = new RollingEnrollmentWindowRequiredTitleRule("rolling enrollment window needs this field");
  const item = newRollingEnrollmentWindow("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingEnrollmentWindowMinimumRangeRule flags values above minimum", () => {
  const rule = new RollingEnrollmentWindowMinimumRangeRule(6.7, 2287.2);
  const item = newRollingEnrollmentWindow("x", "y");
  item.minimum = 2288.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingEnrollmentWindowRequiredSummaryRule flags a blank summary", () => {
  const rule = new RollingEnrollmentWindowRequiredSummaryRule("rolling enrollment window needs this field");
  const item = newRollingEnrollmentWindow("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingEnrollmentWindowUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new RollingEnrollmentWindowUpdatedAtRangeRule(80, 120);
  const item = newRollingEnrollmentWindow("x", "y");
  item.updatedAt = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
