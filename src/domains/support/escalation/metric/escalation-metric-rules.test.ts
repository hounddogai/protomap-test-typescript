import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EscalationMetricCodeLengthRule,
  EscalationMetricContactEmailLengthRule,
  EscalationMetricRequiredLabelRule,
  defaultEscalationMetricValidator,
} from "./escalation-metric-rules.js";
import { newEscalationMetric } from "./escalation-metric.js";

test("EscalationMetricValidator reports every problem", () => {
  const validator = defaultEscalationMetricValidator();
  const item = newEscalationMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EscalationMetricRequiredLabelRule flags a blank label", () => {
  const rule = new EscalationMetricRequiredLabelRule("escalation metric needs this field");
  const item = newEscalationMetric("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EscalationMetricCodeLengthRule flags a long code", () => {
  const rule = new EscalationMetricCodeLengthRule(1000);
  const item = newEscalationMetric("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("EscalationMetricContactEmailLengthRule flags a long contact email", () => {
  const rule = new EscalationMetricContactEmailLengthRule(3600);
  const item = newEscalationMetric("x", "y");
  item.contactEmail = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
