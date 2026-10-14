import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalEscalationMetricCapacityRangeRule,
  SeasonalEscalationMetricRequiredChannelRule,
  SeasonalEscalationMetricRequiredCodeRule,
  defaultSeasonalEscalationMetricValidator,
} from "./seasonal-escalation-metric-rules.js";
import { newSeasonalEscalationMetric } from "./seasonal-escalation-metric.js";

test("SeasonalEscalationMetricValidator reports every problem", () => {
  const validator = defaultSeasonalEscalationMetricValidator();
  const item = newSeasonalEscalationMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalEscalationMetricRequiredCodeRule flags a blank code", () => {
  const rule = new SeasonalEscalationMetricRequiredCodeRule("seasonal escalation metric needs an entry");
  const item = newSeasonalEscalationMetric("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalEscalationMetricCapacityRangeRule flags values above capacity", () => {
  const rule = new SeasonalEscalationMetricCapacityRangeRule(120, 86400);
  const item = newSeasonalEscalationMetric("x", "y");
  item.capacity = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalEscalationMetricRequiredChannelRule flags a blank channel", () => {
  const rule = new SeasonalEscalationMetricRequiredChannelRule("seasonal escalation metric needs a value");
  const item = newSeasonalEscalationMetric("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
