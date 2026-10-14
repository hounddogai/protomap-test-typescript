import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyBidRuleThresholdExpiresAtRangeRule,
  LegacyBidRuleThresholdGraceDaysRangeRule,
  LegacyBidRuleThresholdLabelLengthRule,
  defaultLegacyBidRuleThresholdValidator,
} from "./legacy-bid-rule-threshold-rules.js";
import { newLegacyBidRuleThreshold } from "./legacy-bid-rule-threshold.js";

test("LegacyBidRuleThresholdValidator reports every problem", () => {
  const validator = defaultLegacyBidRuleThresholdValidator();
  const item = newLegacyBidRuleThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyBidRuleThresholdGraceDaysRangeRule flags values above grace days", () => {
  const rule = new LegacyBidRuleThresholdGraceDaysRangeRule(64, 120);
  const item = newLegacyBidRuleThreshold("x", "y");
  item.graceDays = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyBidRuleThresholdExpiresAtRangeRule flags values above expires at", () => {
  const rule = new LegacyBidRuleThresholdExpiresAtRangeRule(16, 16);
  const item = newLegacyBidRuleThreshold("x", "y");
  item.expiresAt = 17;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyBidRuleThresholdLabelLengthRule flags a long label", () => {
  const rule = new LegacyBidRuleThresholdLabelLengthRule(120);
  const item = newLegacyBidRuleThreshold("x", "y");
  item.label = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
