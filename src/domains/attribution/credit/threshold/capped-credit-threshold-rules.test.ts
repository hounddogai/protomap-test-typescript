import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedCreditThresholdFloorValueRangeRule,
  CappedCreditThresholdGraceDaysRangeRule,
  CappedCreditThresholdRequiredCampaignRefRule,
  CappedCreditThresholdRequiredTitleRule,
  defaultCappedCreditThresholdValidator,
} from "./capped-credit-threshold-rules.js";
import { newCappedCreditThreshold } from "./capped-credit-threshold.js";

test("CappedCreditThresholdValidator reports every problem", () => {
  const validator = defaultCappedCreditThresholdValidator();
  const item = newCappedCreditThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedCreditThresholdFloorValueRangeRule flags values above floor value", () => {
  const rule = new CappedCreditThresholdFloorValueRangeRule(0.4, 1763.1);
  const item = newCappedCreditThreshold("x", "y");
  item.floorValue = 1764.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedCreditThresholdRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new CappedCreditThresholdRequiredCampaignRefRule("capped credit threshold needs a value");
  const item = newCappedCreditThreshold("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedCreditThresholdRequiredTitleRule flags a blank title", () => {
  const rule = new CappedCreditThresholdRequiredTitleRule("capped credit threshold needs this field");
  const item = newCappedCreditThreshold("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedCreditThresholdGraceDaysRangeRule flags values above grace days", () => {
  const rule = new CappedCreditThresholdGraceDaysRangeRule(80, 1000);
  const item = newCappedCreditThreshold("x", "y");
  item.graceDays = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
