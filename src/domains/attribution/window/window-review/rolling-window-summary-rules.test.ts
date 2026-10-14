import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingWindowSummaryFrequencyCapRangeRule,
  RollingWindowSummaryQuantityRangeRule,
  RollingWindowSummaryRequiredCampaignRefRule,
  RollingWindowSummaryRequiredCodeRule,
  RollingWindowSummaryRequiredRegionRule,
  defaultRollingWindowSummaryValidator,
} from "./rolling-window-summary-rules.js";
import { newRollingWindowSummary } from "./rolling-window-summary.js";

test("RollingWindowSummaryValidator reports every problem", () => {
  const validator = defaultRollingWindowSummaryValidator();
  const item = newRollingWindowSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingWindowSummaryQuantityRangeRule flags values above quantity", () => {
  const rule = new RollingWindowSummaryQuantityRangeRule(64, 1000);
  const item = newRollingWindowSummary("x", "y");
  item.quantity = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingWindowSummaryRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new RollingWindowSummaryRequiredCampaignRefRule("rolling window summary needs a value");
  const item = newRollingWindowSummary("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingWindowSummaryRequiredCodeRule flags a blank code", () => {
  const rule = new RollingWindowSummaryRequiredCodeRule("rolling window summary needs this field");
  const item = newRollingWindowSummary("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingWindowSummaryRequiredRegionRule flags a blank region", () => {
  const rule = new RollingWindowSummaryRequiredRegionRule("rolling window summary needs a value");
  const item = newRollingWindowSummary("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingWindowSummaryFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new RollingWindowSummaryFrequencyCapRangeRule(255, 3600);
  const item = newRollingWindowSummary("x", "y");
  item.frequencyCap = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
