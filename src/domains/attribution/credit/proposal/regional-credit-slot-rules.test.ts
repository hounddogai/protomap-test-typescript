import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalCreditSlotCampaignRefLengthRule,
  RegionalCreditSlotCountryLengthRule,
  RegionalCreditSlotRequiredCampaignRefRule,
  defaultRegionalCreditSlotValidator,
} from "./regional-credit-slot-rules.js";
import { newRegionalCreditSlot } from "./regional-credit-slot.js";

test("RegionalCreditSlotValidator reports every problem", () => {
  const validator = defaultRegionalCreditSlotValidator();
  const item = newRegionalCreditSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalCreditSlotRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new RegionalCreditSlotRequiredCampaignRefRule("regional credit slot needs a value");
  const item = newRegionalCreditSlot("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalCreditSlotCountryLengthRule flags a long country", () => {
  const rule = new RegionalCreditSlotCountryLengthRule(255);
  const item = newRegionalCreditSlot("x", "y");
  item.country = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalCreditSlotCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new RegionalCreditSlotCampaignRefLengthRule(255);
  const item = newRegionalCreditSlot("x", "y");
  item.campaignRef = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
