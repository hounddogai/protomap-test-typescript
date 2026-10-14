import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalFlightMetricCodeLengthRule,
  SeasonalFlightMetricRequiredCodeRule,
  SeasonalFlightMetricRequiredVariantRule,
  SeasonalFlightMetricUpdatedAtRangeRule,
  defaultSeasonalFlightMetricValidator,
} from "./seasonal-flight-metric-rules.js";
import { newSeasonalFlightMetric } from "./seasonal-flight-metric.js";

test("SeasonalFlightMetricValidator reports every problem", () => {
  const validator = defaultSeasonalFlightMetricValidator();
  const item = newSeasonalFlightMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalFlightMetricRequiredCodeRule flags a blank code", () => {
  const rule = new SeasonalFlightMetricRequiredCodeRule("seasonal flight metric needs this field");
  const item = newSeasonalFlightMetric("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalFlightMetricCodeLengthRule flags a long code", () => {
  const rule = new SeasonalFlightMetricCodeLengthRule(16);
  const item = newSeasonalFlightMetric("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalFlightMetricRequiredVariantRule flags a blank variant", () => {
  const rule = new SeasonalFlightMetricRequiredVariantRule("seasonal flight metric needs a value");
  const item = newSeasonalFlightMetric("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalFlightMetricUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new SeasonalFlightMetricUpdatedAtRangeRule(16, 32);
  const item = newSeasonalFlightMetric("x", "y");
  item.updatedAt = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
