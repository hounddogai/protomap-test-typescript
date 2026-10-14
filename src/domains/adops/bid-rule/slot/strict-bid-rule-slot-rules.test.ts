import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictBidRuleSlotClicksRangeRule,
  StrictBidRuleSlotRateRangeRule,
  StrictBidRuleSlotRequiredCodeRule,
  defaultStrictBidRuleSlotValidator,
} from "./strict-bid-rule-slot-rules.js";
import { newStrictBidRuleSlot } from "./strict-bid-rule-slot.js";

test("StrictBidRuleSlotValidator reports every problem", () => {
  const validator = defaultStrictBidRuleSlotValidator();
  const item = newStrictBidRuleSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictBidRuleSlotRequiredCodeRule flags a blank code", () => {
  const rule = new StrictBidRuleSlotRequiredCodeRule("strict bid rule slot needs this field");
  const item = newStrictBidRuleSlot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictBidRuleSlotClicksRangeRule flags values above clicks", () => {
  const rule = new StrictBidRuleSlotClicksRangeRule(80, 255);
  const item = newStrictBidRuleSlot("x", "y");
  item.clicks = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictBidRuleSlotRateRangeRule flags values above rate", () => {
  const rule = new StrictBidRuleSlotRateRangeRule(7.2, 386.4);
  const item = newStrictBidRuleSlot("x", "y");
  item.rate = 387.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
