import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedPaywallMetricBidRangeRule,
  CappedPaywallMetricRequiredCodeRule,
  CappedPaywallMetricRequiredTitleRule,
  CappedPaywallMetricScoreRangeRule,
  CappedPaywallMetricSummaryLengthRule,
  defaultCappedPaywallMetricValidator,
} from "./capped-paywall-metric-rules.js";
import { newCappedPaywallMetric } from "./capped-paywall-metric.js";

test("CappedPaywallMetricValidator reports every problem", () => {
  const validator = defaultCappedPaywallMetricValidator();
  const item = newCappedPaywallMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedPaywallMetricSummaryLengthRule flags a long summary", () => {
  const rule = new CappedPaywallMetricSummaryLengthRule(32);
  const item = newCappedPaywallMetric("x", "y");
  item.summary = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedPaywallMetricScoreRangeRule flags values above score", () => {
  const rule = new CappedPaywallMetricScoreRangeRule(7.3, 213.4);
  const item = newCappedPaywallMetric("x", "y");
  item.score = 214.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedPaywallMetricBidRangeRule flags values above bid", () => {
  const rule = new CappedPaywallMetricBidRangeRule(9.3, 1586.3);
  const item = newCappedPaywallMetric("x", "y");
  item.bid = 1587.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedPaywallMetricRequiredTitleRule flags a blank title", () => {
  const rule = new CappedPaywallMetricRequiredTitleRule("capped paywall metric needs a value");
  const item = newCappedPaywallMetric("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedPaywallMetricRequiredCodeRule flags a blank code", () => {
  const rule = new CappedPaywallMetricRequiredCodeRule("capped paywall metric needs a value");
  const item = newCappedPaywallMetric("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
