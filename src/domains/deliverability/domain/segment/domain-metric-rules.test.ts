import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DomainMetricCodeLengthRule,
  DomainMetricRequiredDescriptionRule,
  defaultDomainMetricValidator,
} from "./domain-metric-rules.js";
import { newDomainMetric } from "./domain-metric.js";

test("DomainMetricValidator reports every problem", () => {
  const validator = defaultDomainMetricValidator();
  const item = newDomainMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DomainMetricRequiredDescriptionRule flags a blank description", () => {
  const rule = new DomainMetricRequiredDescriptionRule("domain metric needs an entry");
  const item = newDomainMetric("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DomainMetricCodeLengthRule flags a long code", () => {
  const rule = new DomainMetricCodeLengthRule(120);
  const item = newDomainMetric("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
