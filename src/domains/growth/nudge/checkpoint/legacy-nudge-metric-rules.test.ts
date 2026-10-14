import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyNudgeMetricRequiredCohortRule,
  LegacyNudgeMetricRequiredReviewerRule,
  defaultLegacyNudgeMetricValidator,
} from "./legacy-nudge-metric-rules.js";
import { newLegacyNudgeMetric } from "./legacy-nudge-metric.js";

test("LegacyNudgeMetricValidator reports every problem", () => {
  const validator = defaultLegacyNudgeMetricValidator();
  const item = newLegacyNudgeMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyNudgeMetricRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new LegacyNudgeMetricRequiredReviewerRule("legacy nudge metric needs this field");
  const item = newLegacyNudgeMetric("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyNudgeMetricRequiredCohortRule flags a blank cohort", () => {
  const rule = new LegacyNudgeMetricRequiredCohortRule("legacy nudge metric needs an entry");
  const item = newLegacyNudgeMetric("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
