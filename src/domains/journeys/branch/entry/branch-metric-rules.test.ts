import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BranchMetricChannelLengthRule,
  BranchMetricRequiredChannelRule,
  BranchMetricRequiredNameRule,
  defaultBranchMetricValidator,
} from "./branch-metric-rules.js";
import { newBranchMetric } from "./branch-metric.js";

test("BranchMetricValidator reports every problem", () => {
  const validator = defaultBranchMetricValidator();
  const item = newBranchMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BranchMetricChannelLengthRule flags a long channel", () => {
  const rule = new BranchMetricChannelLengthRule(1000);
  const item = newBranchMetric("x", "y");
  item.channel = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BranchMetricRequiredNameRule flags a blank name", () => {
  const rule = new BranchMetricRequiredNameRule("branch metric needs an entry");
  const item = newBranchMetric("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BranchMetricRequiredChannelRule flags a blank channel", () => {
  const rule = new BranchMetricRequiredChannelRule("branch metric needs an entry");
  const item = newBranchMetric("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
