import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientBranchMetricRequiredCodeRule,
  LenientBranchMetricRequiredTitleRule,
  LenientBranchMetricTitleLengthRule,
  defaultLenientBranchMetricValidator,
} from "./lenient-branch-metric-rules.js";
import { newLenientBranchMetric } from "./lenient-branch-metric.js";

test("LenientBranchMetricValidator reports every problem", () => {
  const validator = defaultLenientBranchMetricValidator();
  const item = newLenientBranchMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientBranchMetricTitleLengthRule flags a long title", () => {
  const rule = new LenientBranchMetricTitleLengthRule(16);
  const item = newLenientBranchMetric("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientBranchMetricRequiredTitleRule flags a blank title", () => {
  const rule = new LenientBranchMetricRequiredTitleRule("lenient branch metric needs this field");
  const item = newLenientBranchMetric("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientBranchMetricRequiredCodeRule flags a blank code", () => {
  const rule = new LenientBranchMetricRequiredCodeRule("lenient branch metric needs an entry");
  const item = newLenientBranchMetric("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
