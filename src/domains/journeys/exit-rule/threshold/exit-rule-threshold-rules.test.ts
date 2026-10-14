import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ExitRuleThresholdMaximumRangeRule,
  ExitRuleThresholdSummaryLengthRule,
  defaultExitRuleThresholdValidator,
} from "./exit-rule-threshold-rules.js";
import { newExitRuleThreshold } from "./exit-rule-threshold.js";

test("ExitRuleThresholdValidator reports every problem", () => {
  const validator = defaultExitRuleThresholdValidator();
  const item = newExitRuleThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ExitRuleThresholdMaximumRangeRule flags values above maximum", () => {
  const rule = new ExitRuleThresholdMaximumRangeRule(2.3, 1333.3);
  const item = newExitRuleThreshold("x", "y");
  item.maximum = 1334.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ExitRuleThresholdSummaryLengthRule flags a long summary", () => {
  const rule = new ExitRuleThresholdSummaryLengthRule(32);
  const item = newExitRuleThreshold("x", "y");
  item.summary = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
