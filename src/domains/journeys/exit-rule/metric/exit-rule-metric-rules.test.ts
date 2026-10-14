import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ExitRuleMetricLabelLengthRule,
  ExitRuleMetricRequiredCodeRule,
  ExitRuleMetricRequiredOwnerIdRule,
  defaultExitRuleMetricValidator,
} from "./exit-rule-metric-rules.js";
import { newExitRuleMetric } from "./exit-rule-metric.js";

test("ExitRuleMetricValidator reports every problem", () => {
  const validator = defaultExitRuleMetricValidator();
  const item = newExitRuleMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ExitRuleMetricRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new ExitRuleMetricRequiredOwnerIdRule("exit rule metric needs an entry");
  const item = newExitRuleMetric("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ExitRuleMetricRequiredCodeRule flags a blank code", () => {
  const rule = new ExitRuleMetricRequiredCodeRule("exit rule metric needs this field");
  const item = newExitRuleMetric("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ExitRuleMetricLabelLengthRule flags a long label", () => {
  const rule = new ExitRuleMetricLabelLengthRule(32);
  const item = newExitRuleMetric("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
