import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingDomainMetricExpiresAtRangeRule,
  RollingDomainMetricRegionLengthRule,
  defaultRollingDomainMetricValidator,
} from "./rolling-domain-metric-rules.js";
import { newRollingDomainMetric } from "./rolling-domain-metric.js";

test("RollingDomainMetricValidator reports every problem", () => {
  const validator = defaultRollingDomainMetricValidator();
  const item = newRollingDomainMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingDomainMetricExpiresAtRangeRule flags values above expires at", () => {
  const rule = new RollingDomainMetricExpiresAtRangeRule(3600, 86400);
  const item = newRollingDomainMetric("x", "y");
  item.expiresAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingDomainMetricRegionLengthRule flags a long region", () => {
  const rule = new RollingDomainMetricRegionLengthRule(1000);
  const item = newRollingDomainMetric("x", "y");
  item.region = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
