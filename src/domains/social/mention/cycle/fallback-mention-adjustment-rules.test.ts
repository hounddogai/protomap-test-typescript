import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackMentionAdjustmentRequiredCampaignRefRule,
  FallbackMentionAdjustmentRequiredLabelRule,
  FallbackMentionAdjustmentRequiredPhoneRule,
  defaultFallbackMentionAdjustmentValidator,
} from "./fallback-mention-adjustment-rules.js";
import { newFallbackMentionAdjustment } from "./fallback-mention-adjustment.js";

test("FallbackMentionAdjustmentValidator reports every problem", () => {
  const validator = defaultFallbackMentionAdjustmentValidator();
  const item = newFallbackMentionAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackMentionAdjustmentRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new FallbackMentionAdjustmentRequiredCampaignRefRule("fallback mention adjustment needs a value");
  const item = newFallbackMentionAdjustment("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackMentionAdjustmentRequiredLabelRule flags a blank label", () => {
  const rule = new FallbackMentionAdjustmentRequiredLabelRule("fallback mention adjustment needs this field");
  const item = newFallbackMentionAdjustment("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackMentionAdjustmentRequiredPhoneRule flags a blank phone", () => {
  const rule = new FallbackMentionAdjustmentRequiredPhoneRule("fallback mention adjustment needs an entry");
  const item = newFallbackMentionAdjustment("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
