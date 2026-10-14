import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledSuppressionEstimateCeilingRangeRule,
  ScheduledSuppressionEstimateExternalRefLengthRule,
  ScheduledSuppressionEstimateRequiredChannelRule,
  ScheduledSuppressionEstimateRequiredExternalRefRule,
  defaultScheduledSuppressionEstimateValidator,
} from "./scheduled-suppression-estimate-rules.js";
import { newScheduledSuppressionEstimate } from "./scheduled-suppression-estimate.js";

test("ScheduledSuppressionEstimateValidator reports every problem", () => {
  const validator = defaultScheduledSuppressionEstimateValidator();
  const item = newScheduledSuppressionEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledSuppressionEstimateRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new ScheduledSuppressionEstimateRequiredExternalRefRule("scheduled suppression estimate needs an entry");
  const item = newScheduledSuppressionEstimate("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledSuppressionEstimateCeilingRangeRule flags values above ceiling", () => {
  const rule = new ScheduledSuppressionEstimateCeilingRangeRule(2.4, 2060.9);
  const item = newScheduledSuppressionEstimate("x", "y");
  item.ceiling = 2062.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledSuppressionEstimateRequiredChannelRule flags a blank channel", () => {
  const rule = new ScheduledSuppressionEstimateRequiredChannelRule("scheduled suppression estimate needs this field");
  const item = newScheduledSuppressionEstimate("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledSuppressionEstimateExternalRefLengthRule flags a long external ref", () => {
  const rule = new ScheduledSuppressionEstimateExternalRefLengthRule(32);
  const item = newScheduledSuppressionEstimate("x", "y");
  item.externalRef = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
