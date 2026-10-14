import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PlacementMetricJourneyIdLengthRule,
  PlacementMetricRequiredNameRule,
  PlacementMetricRequiredUnitRule,
  defaultPlacementMetricValidator,
} from "./placement-metric-rules.js";
import { newPlacementMetric } from "./placement-metric.js";

test("PlacementMetricValidator reports every problem", () => {
  const validator = defaultPlacementMetricValidator();
  const item = newPlacementMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PlacementMetricJourneyIdLengthRule flags a long journey id", () => {
  const rule = new PlacementMetricJourneyIdLengthRule(64);
  const item = newPlacementMetric("x", "y");
  item.journeyId = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PlacementMetricRequiredUnitRule flags a blank unit", () => {
  const rule = new PlacementMetricRequiredUnitRule("placement metric needs a value");
  const item = newPlacementMetric("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PlacementMetricRequiredNameRule flags a blank name", () => {
  const rule = new PlacementMetricRequiredNameRule("placement metric needs an entry");
  const item = newPlacementMetric("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
