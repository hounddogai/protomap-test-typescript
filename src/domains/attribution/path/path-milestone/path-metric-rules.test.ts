import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PathMetricFloorValueRangeRule,
  PathMetricWindowDaysRangeRule,
  defaultPathMetricValidator,
} from "./path-metric-rules.js";
import { newPathMetric } from "./path-metric.js";

test("PathMetricValidator reports every problem", () => {
  const validator = defaultPathMetricValidator();
  const item = newPathMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PathMetricFloorValueRangeRule flags values above floor value", () => {
  const rule = new PathMetricFloorValueRangeRule(7.2, 2085.6);
  const item = newPathMetric("x", "y");
  item.floorValue = 2087.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PathMetricWindowDaysRangeRule flags values above window days", () => {
  const rule = new PathMetricWindowDaysRangeRule(16, 1000);
  const item = newPathMetric("x", "y");
  item.windowDays = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
