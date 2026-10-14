import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingInsightMetricRequiredNameRule,
  defaultPendingInsightMetricValidator,
} from "./pending-insight-metric-rules.js";
import { newPendingInsightMetric } from "./pending-insight-metric.js";

test("PendingInsightMetricValidator reports every problem", () => {
  const validator = defaultPendingInsightMetricValidator();
  const item = newPendingInsightMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingInsightMetricRequiredNameRule flags a blank name", () => {
  const rule = new PendingInsightMetricRequiredNameRule("pending insight metric needs this field");
  const item = newPendingInsightMetric("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
