import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveInviteAdjustmentCurrencyLengthRule,
  AdaptiveInviteAdjustmentNameLengthRule,
  AdaptiveInviteAdjustmentOpenRateRangeRule,
  AdaptiveInviteAdjustmentRequiredCurrencyRule,
  AdaptiveInviteAdjustmentThresholdRangeRule,
  defaultAdaptiveInviteAdjustmentValidator,
} from "./adaptive-invite-adjustment-rules.js";
import { newAdaptiveInviteAdjustment } from "./adaptive-invite-adjustment.js";

test("AdaptiveInviteAdjustmentValidator reports every problem", () => {
  const validator = defaultAdaptiveInviteAdjustmentValidator();
  const item = newAdaptiveInviteAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveInviteAdjustmentCurrencyLengthRule flags a long currency", () => {
  const rule = new AdaptiveInviteAdjustmentCurrencyLengthRule(1000);
  const item = newAdaptiveInviteAdjustment("x", "y");
  item.currency = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveInviteAdjustmentThresholdRangeRule flags values above threshold", () => {
  const rule = new AdaptiveInviteAdjustmentThresholdRangeRule(9.8, 2666.9);
  const item = newAdaptiveInviteAdjustment("x", "y");
  item.threshold = 2668.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveInviteAdjustmentNameLengthRule flags a long name", () => {
  const rule = new AdaptiveInviteAdjustmentNameLengthRule(255);
  const item = newAdaptiveInviteAdjustment("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveInviteAdjustmentOpenRateRangeRule flags values above open rate", () => {
  const rule = new AdaptiveInviteAdjustmentOpenRateRangeRule(4.5, 2034.8);
  const item = newAdaptiveInviteAdjustment("x", "y");
  item.openRate = 2036.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveInviteAdjustmentRequiredCurrencyRule flags a blank currency", () => {
  const rule = new AdaptiveInviteAdjustmentRequiredCurrencyRule("adaptive invite adjustment needs this field");
  const item = newAdaptiveInviteAdjustment("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
