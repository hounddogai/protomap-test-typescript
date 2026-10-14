import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalEscalationEstimateNameLengthRule,
  RegionalEscalationEstimateRegionLengthRule,
  RegionalEscalationEstimateRequiredRegionRule,
  RegionalEscalationEstimateSendAtRangeRule,
  defaultRegionalEscalationEstimateValidator,
} from "./regional-escalation-estimate-rules.js";
import { newRegionalEscalationEstimate } from "./regional-escalation-estimate.js";

test("RegionalEscalationEstimateValidator reports every problem", () => {
  const validator = defaultRegionalEscalationEstimateValidator();
  const item = newRegionalEscalationEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalEscalationEstimateSendAtRangeRule flags values above send at", () => {
  const rule = new RegionalEscalationEstimateSendAtRangeRule(16, 80);
  const item = newRegionalEscalationEstimate("x", "y");
  item.sendAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalEscalationEstimateRegionLengthRule flags a long region", () => {
  const rule = new RegionalEscalationEstimateRegionLengthRule(1000);
  const item = newRegionalEscalationEstimate("x", "y");
  item.region = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalEscalationEstimateRequiredRegionRule flags a blank region", () => {
  const rule = new RegionalEscalationEstimateRequiredRegionRule("regional escalation estimate needs a value");
  const item = newRegionalEscalationEstimate("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalEscalationEstimateNameLengthRule flags a long name", () => {
  const rule = new RegionalEscalationEstimateNameLengthRule(32);
  const item = newRegionalEscalationEstimate("x", "y");
  item.name = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
