import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualFunnelExceptionAttemptsRangeRule,
  ManualFunnelExceptionCampaignRefLengthRule,
  ManualFunnelExceptionCodeLengthRule,
  ManualFunnelExceptionRequiredCampaignRefRule,
  ManualFunnelExceptionRequiredLabelRule,
  defaultManualFunnelExceptionValidator,
} from "./manual-funnel-exception-rules.js";
import { newManualFunnelException } from "./manual-funnel-exception.js";

test("ManualFunnelExceptionValidator reports every problem", () => {
  const validator = defaultManualFunnelExceptionValidator();
  const item = newManualFunnelException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualFunnelExceptionAttemptsRangeRule flags values above attempts", () => {
  const rule = new ManualFunnelExceptionAttemptsRangeRule(32, 64);
  const item = newManualFunnelException("x", "y");
  item.attempts = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualFunnelExceptionRequiredLabelRule flags a blank label", () => {
  const rule = new ManualFunnelExceptionRequiredLabelRule("manual funnel exception needs this field");
  const item = newManualFunnelException("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualFunnelExceptionRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new ManualFunnelExceptionRequiredCampaignRefRule("manual funnel exception needs this field");
  const item = newManualFunnelException("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualFunnelExceptionCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new ManualFunnelExceptionCampaignRefLengthRule(64);
  const item = newManualFunnelException("x", "y");
  item.campaignRef = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualFunnelExceptionCodeLengthRule flags a long code", () => {
  const rule = new ManualFunnelExceptionCodeLengthRule(16);
  const item = newManualFunnelException("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
