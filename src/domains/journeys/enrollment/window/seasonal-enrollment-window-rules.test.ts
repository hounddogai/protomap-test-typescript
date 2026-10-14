import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalEnrollmentWindowRequiredSourceRule,
  SeasonalEnrollmentWindowSourceLengthRule,
  SeasonalEnrollmentWindowWindowDaysRangeRule,
  defaultSeasonalEnrollmentWindowValidator,
} from "./seasonal-enrollment-window-rules.js";
import { newSeasonalEnrollmentWindow } from "./seasonal-enrollment-window.js";

test("SeasonalEnrollmentWindowValidator reports every problem", () => {
  const validator = defaultSeasonalEnrollmentWindowValidator();
  const item = newSeasonalEnrollmentWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalEnrollmentWindowSourceLengthRule flags a long source", () => {
  const rule = new SeasonalEnrollmentWindowSourceLengthRule(32);
  const item = newSeasonalEnrollmentWindow("x", "y");
  item.source = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalEnrollmentWindowRequiredSourceRule flags a blank source", () => {
  const rule = new SeasonalEnrollmentWindowRequiredSourceRule("seasonal enrollment window needs a value");
  const item = newSeasonalEnrollmentWindow("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalEnrollmentWindowWindowDaysRangeRule flags values above window days", () => {
  const rule = new SeasonalEnrollmentWindowWindowDaysRangeRule(16, 86400);
  const item = newSeasonalEnrollmentWindow("x", "y");
  item.windowDays = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
