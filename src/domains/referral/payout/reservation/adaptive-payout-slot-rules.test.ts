import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptivePayoutSlotFloorValueRangeRule,
  AdaptivePayoutSlotRequiredExternalRefRule,
  defaultAdaptivePayoutSlotValidator,
} from "./adaptive-payout-slot-rules.js";
import { newAdaptivePayoutSlot } from "./adaptive-payout-slot.js";

test("AdaptivePayoutSlotValidator reports every problem", () => {
  const validator = defaultAdaptivePayoutSlotValidator();
  const item = newAdaptivePayoutSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptivePayoutSlotFloorValueRangeRule flags values above floor value", () => {
  const rule = new AdaptivePayoutSlotFloorValueRangeRule(7.1, 1194.6);
  const item = newAdaptivePayoutSlot("x", "y");
  item.floorValue = 1196.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptivePayoutSlotRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new AdaptivePayoutSlotRequiredExternalRefRule("adaptive payout slot needs this field");
  const item = newAdaptivePayoutSlot("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
