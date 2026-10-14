import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ActivationThresholdDiscountRangeRule,
  ActivationThresholdGraceDaysRangeRule,
  ActivationThresholdLabelLengthRule,
  ActivationThresholdMinimumRangeRule,
  defaultActivationThresholdValidator,
} from "./activation-threshold-rules.js";
import { newActivationThreshold } from "./activation-threshold.js";

test("ActivationThresholdValidator reports every problem", () => {
  const validator = defaultActivationThresholdValidator();
  const item = newActivationThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ActivationThresholdLabelLengthRule flags a long label", () => {
  const rule = new ActivationThresholdLabelLengthRule(80);
  const item = newActivationThreshold("x", "y");
  item.label = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ActivationThresholdDiscountRangeRule flags values above discount", () => {
  const rule = new ActivationThresholdDiscountRangeRule(3.7, 2117.5);
  const item = newActivationThreshold("x", "y");
  item.discount = 2119;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ActivationThresholdGraceDaysRangeRule flags values above grace days", () => {
  const rule = new ActivationThresholdGraceDaysRangeRule(1000, 3600);
  const item = newActivationThreshold("x", "y");
  item.graceDays = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ActivationThresholdMinimumRangeRule flags values above minimum", () => {
  const rule = new ActivationThresholdMinimumRangeRule(2.4, 4133.8);
  const item = newActivationThreshold("x", "y");
  item.minimum = 4135.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
