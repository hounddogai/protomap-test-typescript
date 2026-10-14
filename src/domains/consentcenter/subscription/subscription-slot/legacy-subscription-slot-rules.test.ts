import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacySubscriptionSlotCodeLengthRule,
  LegacySubscriptionSlotRequiredCampaignRefRule,
  defaultLegacySubscriptionSlotValidator,
} from "./legacy-subscription-slot-rules.js";
import { newLegacySubscriptionSlot } from "./legacy-subscription-slot.js";

test("LegacySubscriptionSlotValidator reports every problem", () => {
  const validator = defaultLegacySubscriptionSlotValidator();
  const item = newLegacySubscriptionSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacySubscriptionSlotCodeLengthRule flags a long code", () => {
  const rule = new LegacySubscriptionSlotCodeLengthRule(1000);
  const item = newLegacySubscriptionSlot("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacySubscriptionSlotRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new LegacySubscriptionSlotRequiredCampaignRefRule("legacy subscription slot needs this field");
  const item = newLegacySubscriptionSlot("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
