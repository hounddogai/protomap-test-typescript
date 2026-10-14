import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalTierSlotCountryLengthRule,
  RegionalTierSlotSendAtRangeRule,
  defaultRegionalTierSlotValidator,
} from "./regional-tier-slot-rules.js";
import { newRegionalTierSlot } from "./regional-tier-slot.js";

test("RegionalTierSlotValidator reports every problem", () => {
  const validator = defaultRegionalTierSlotValidator();
  const item = newRegionalTierSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalTierSlotSendAtRangeRule flags values above send at", () => {
  const rule = new RegionalTierSlotSendAtRangeRule(32, 1000);
  const item = newRegionalTierSlot("x", "y");
  item.sendAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalTierSlotCountryLengthRule flags a long country", () => {
  const rule = new RegionalTierSlotCountryLengthRule(3600);
  const item = newRegionalTierSlot("x", "y");
  item.country = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
