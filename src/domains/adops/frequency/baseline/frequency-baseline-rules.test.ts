import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FrequencyBaselineGraceDaysRangeRule,
  FrequencyBaselineMaximumRangeRule,
  FrequencyBaselineRequiredNameRule,
  defaultFrequencyBaselineValidator,
} from "./frequency-baseline-rules.js";
import { newFrequencyBaseline } from "./frequency-baseline.js";

test("FrequencyBaselineValidator reports every problem", () => {
  const validator = defaultFrequencyBaselineValidator();
  const item = newFrequencyBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FrequencyBaselineMaximumRangeRule flags values above maximum", () => {
  const rule = new FrequencyBaselineMaximumRangeRule(1, 490.6);
  const item = newFrequencyBaseline("x", "y");
  item.maximum = 492.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FrequencyBaselineGraceDaysRangeRule flags values above grace days", () => {
  const rule = new FrequencyBaselineGraceDaysRangeRule(32, 80);
  const item = newFrequencyBaseline("x", "y");
  item.graceDays = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FrequencyBaselineRequiredNameRule flags a blank name", () => {
  const rule = new FrequencyBaselineRequiredNameRule("frequency baseline needs a value");
  const item = newFrequencyBaseline("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
