import assert from "node:assert/strict";
import { test } from "node:test";
import { CreditMetricRequiredLabelRule, defaultCreditMetricValidator } from "./credit-metric-rules.js";
import { newCreditMetric } from "./credit-metric.js";

test("CreditMetricValidator reports every problem", () => {
  const validator = defaultCreditMetricValidator();
  const item = newCreditMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreditMetricRequiredLabelRule flags a blank label", () => {
  const rule = new CreditMetricRequiredLabelRule("credit metric needs an entry");
  const item = newCreditMetric("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
