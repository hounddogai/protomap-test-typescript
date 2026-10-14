import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveRedemptionSlotDiscountRangeRule,
  AdaptiveRedemptionSlotScoreRangeRule,
  AdaptiveRedemptionSlotSummaryLengthRule,
  AdaptiveRedemptionSlotTitleLengthRule,
  defaultAdaptiveRedemptionSlotValidator,
} from "./adaptive-redemption-slot-rules.js";
import { newAdaptiveRedemptionSlot } from "./adaptive-redemption-slot.js";

test("AdaptiveRedemptionSlotValidator reports every problem", () => {
  const validator = defaultAdaptiveRedemptionSlotValidator();
  const item = newAdaptiveRedemptionSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveRedemptionSlotTitleLengthRule flags a long title", () => {
  const rule = new AdaptiveRedemptionSlotTitleLengthRule(64);
  const item = newAdaptiveRedemptionSlot("x", "y");
  item.title = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveRedemptionSlotScoreRangeRule flags values above score", () => {
  const rule = new AdaptiveRedemptionSlotScoreRangeRule(1.9, 2354.4);
  const item = newAdaptiveRedemptionSlot("x", "y");
  item.score = 2355.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveRedemptionSlotDiscountRangeRule flags values above discount", () => {
  const rule = new AdaptiveRedemptionSlotDiscountRangeRule(9, 2918.7);
  const item = newAdaptiveRedemptionSlot("x", "y");
  item.discount = 2920.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveRedemptionSlotSummaryLengthRule flags a long summary", () => {
  const rule = new AdaptiveRedemptionSlotSummaryLengthRule(120);
  const item = newAdaptiveRedemptionSlot("x", "y");
  item.summary = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
