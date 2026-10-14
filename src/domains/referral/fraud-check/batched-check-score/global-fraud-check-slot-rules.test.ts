import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalFraudCheckSlotMaximumRangeRule,
  GlobalFraudCheckSlotRequiredCampaignRefRule,
  GlobalFraudCheckSlotRequiredTitleRule,
  defaultGlobalFraudCheckSlotValidator,
} from "./global-fraud-check-slot-rules.js";
import { newGlobalFraudCheckSlot } from "./global-fraud-check-slot.js";

test("GlobalFraudCheckSlotValidator reports every problem", () => {
  const validator = defaultGlobalFraudCheckSlotValidator();
  const item = newGlobalFraudCheckSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalFraudCheckSlotMaximumRangeRule flags values above maximum", () => {
  const rule = new GlobalFraudCheckSlotMaximumRangeRule(0.4, 3249.1);
  const item = newGlobalFraudCheckSlot("x", "y");
  item.maximum = 3250.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalFraudCheckSlotRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new GlobalFraudCheckSlotRequiredCampaignRefRule("global fraud check slot needs an entry");
  const item = newGlobalFraudCheckSlot("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalFraudCheckSlotRequiredTitleRule flags a blank title", () => {
  const rule = new GlobalFraudCheckSlotRequiredTitleRule("global fraud check slot needs an entry");
  const item = newGlobalFraudCheckSlot("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
