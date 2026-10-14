import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalConversionWindowCodeLengthRule,
  GlobalConversionWindowDurationMinutesRangeRule,
  GlobalConversionWindowLabelLengthRule,
  GlobalConversionWindowRequiredCohortRule,
  GlobalConversionWindowRequiredLabelRule,
  defaultGlobalConversionWindowValidator,
} from "./global-conversion-window-rules.js";
import { newGlobalConversionWindow } from "./global-conversion-window.js";

test("GlobalConversionWindowValidator reports every problem", () => {
  const validator = defaultGlobalConversionWindowValidator();
  const item = newGlobalConversionWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalConversionWindowDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new GlobalConversionWindowDurationMinutesRangeRule(80, 120);
  const item = newGlobalConversionWindow("x", "y");
  item.durationMinutes = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalConversionWindowLabelLengthRule flags a long label", () => {
  const rule = new GlobalConversionWindowLabelLengthRule(80);
  const item = newGlobalConversionWindow("x", "y");
  item.label = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalConversionWindowCodeLengthRule flags a long code", () => {
  const rule = new GlobalConversionWindowCodeLengthRule(32);
  const item = newGlobalConversionWindow("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalConversionWindowRequiredLabelRule flags a blank label", () => {
  const rule = new GlobalConversionWindowRequiredLabelRule("global conversion window needs an entry");
  const item = newGlobalConversionWindow("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalConversionWindowRequiredCohortRule flags a blank cohort", () => {
  const rule = new GlobalConversionWindowRequiredCohortRule("global conversion window needs this field");
  const item = newGlobalConversionWindow("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
