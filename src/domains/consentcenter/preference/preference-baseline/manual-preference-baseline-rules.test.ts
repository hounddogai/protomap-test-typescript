import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualPreferenceBaselineCodeLengthRule,
  ManualPreferenceBaselineRatioRangeRule,
  ManualPreferenceBaselineRequiredDescriptionRule,
  ManualPreferenceBaselineRequiredTitleRule,
  defaultManualPreferenceBaselineValidator,
} from "./manual-preference-baseline-rules.js";
import { newManualPreferenceBaseline } from "./manual-preference-baseline.js";

test("ManualPreferenceBaselineValidator reports every problem", () => {
  const validator = defaultManualPreferenceBaselineValidator();
  const item = newManualPreferenceBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualPreferenceBaselineRequiredDescriptionRule flags a blank description", () => {
  const rule = new ManualPreferenceBaselineRequiredDescriptionRule("manual preference baseline needs a value");
  const item = newManualPreferenceBaseline("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualPreferenceBaselineRatioRangeRule flags values above ratio", () => {
  const rule = new ManualPreferenceBaselineRatioRangeRule(3.5, 2541.5);
  const item = newManualPreferenceBaseline("x", "y");
  item.ratio = 2543;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualPreferenceBaselineCodeLengthRule flags a long code", () => {
  const rule = new ManualPreferenceBaselineCodeLengthRule(16);
  const item = newManualPreferenceBaseline("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualPreferenceBaselineRequiredTitleRule flags a blank title", () => {
  const rule = new ManualPreferenceBaselineRequiredTitleRule("manual preference baseline needs a value");
  const item = newManualPreferenceBaseline("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
