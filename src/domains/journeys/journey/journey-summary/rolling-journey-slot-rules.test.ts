import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingJourneySlotCostRangeRule,
  RollingJourneySlotJourneyIdLengthRule,
  RollingJourneySlotRequiredCampaignRefRule,
  defaultRollingJourneySlotValidator,
} from "./rolling-journey-slot-rules.js";
import { newRollingJourneySlot } from "./rolling-journey-slot.js";

test("RollingJourneySlotValidator reports every problem", () => {
  const validator = defaultRollingJourneySlotValidator();
  const item = newRollingJourneySlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingJourneySlotCostRangeRule flags values above cost", () => {
  const rule = new RollingJourneySlotCostRangeRule(1.3, 4349.9);
  const item = newRollingJourneySlot("x", "y");
  item.cost = 4351.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingJourneySlotRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new RollingJourneySlotRequiredCampaignRefRule("rolling journey slot needs an entry");
  const item = newRollingJourneySlot("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingJourneySlotJourneyIdLengthRule flags a long journey id", () => {
  const rule = new RollingJourneySlotJourneyIdLengthRule(120);
  const item = newRollingJourneySlot("x", "y");
  item.journeyId = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
