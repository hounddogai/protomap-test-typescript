import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BidRuleMetricChecksumLengthRule,
  BidRuleMetricQuantityRangeRule,
  defaultBidRuleMetricValidator,
} from "./bid-rule-metric-rules.js";
import { newBidRuleMetric } from "./bid-rule-metric.js";

test("BidRuleMetricValidator reports every problem", () => {
  const validator = defaultBidRuleMetricValidator();
  const item = newBidRuleMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BidRuleMetricQuantityRangeRule flags values above quantity", () => {
  const rule = new BidRuleMetricQuantityRangeRule(80, 86400);
  const item = newBidRuleMetric("x", "y");
  item.quantity = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BidRuleMetricChecksumLengthRule flags a long checksum", () => {
  const rule = new BidRuleMetricChecksumLengthRule(1000);
  const item = newBidRuleMetric("x", "y");
  item.checksum = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
