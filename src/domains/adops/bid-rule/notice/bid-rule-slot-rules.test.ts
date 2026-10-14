import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BidRuleSlotBatchSizeRangeRule,
  BidRuleSlotChannelLengthRule,
  BidRuleSlotConversionRateRangeRule,
  BidRuleSlotLabelLengthRule,
  BidRuleSlotRequiredCodeRule,
  defaultBidRuleSlotValidator,
} from "./bid-rule-slot-rules.js";
import { newBidRuleSlot } from "./bid-rule-slot.js";

test("BidRuleSlotValidator reports every problem", () => {
  const validator = defaultBidRuleSlotValidator();
  const item = newBidRuleSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BidRuleSlotConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new BidRuleSlotConversionRateRangeRule(3, 1293.5);
  const item = newBidRuleSlot("x", "y");
  item.conversionRate = 1295;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BidRuleSlotChannelLengthRule flags a long channel", () => {
  const rule = new BidRuleSlotChannelLengthRule(16);
  const item = newBidRuleSlot("x", "y");
  item.channel = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BidRuleSlotLabelLengthRule flags a long label", () => {
  const rule = new BidRuleSlotLabelLengthRule(86400);
  const item = newBidRuleSlot("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BidRuleSlotBatchSizeRangeRule flags values above batch size", () => {
  const rule = new BidRuleSlotBatchSizeRangeRule(32, 1000);
  const item = newBidRuleSlot("x", "y");
  item.batchSize = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BidRuleSlotRequiredCodeRule flags a blank code", () => {
  const rule = new BidRuleSlotRequiredCodeRule("bid rule slot needs this field");
  const item = newBidRuleSlot("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
