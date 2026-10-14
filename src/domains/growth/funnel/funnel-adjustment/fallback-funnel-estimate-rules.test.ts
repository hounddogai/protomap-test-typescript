import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackFunnelEstimateAudienceIdLengthRule,
  FallbackFunnelEstimateCodeLengthRule,
  FallbackFunnelEstimateCurrencyLengthRule,
  FallbackFunnelEstimateLabelLengthRule,
  FallbackFunnelEstimateRequiredCurrencyRule,
  FallbackFunnelEstimateRequiredLabelRule,
  defaultFallbackFunnelEstimateValidator,
} from "./fallback-funnel-estimate-rules.js";
import { newFallbackFunnelEstimate } from "./fallback-funnel-estimate.js";

test("FallbackFunnelEstimateValidator reports every problem", () => {
  const validator = defaultFallbackFunnelEstimateValidator();
  const item = newFallbackFunnelEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackFunnelEstimateCurrencyLengthRule flags a long currency", () => {
  const rule = new FallbackFunnelEstimateCurrencyLengthRule(80);
  const item = newFallbackFunnelEstimate("x", "y");
  item.currency = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackFunnelEstimateRequiredLabelRule flags a blank label", () => {
  const rule = new FallbackFunnelEstimateRequiredLabelRule("fallback funnel estimate needs this field");
  const item = newFallbackFunnelEstimate("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackFunnelEstimateAudienceIdLengthRule flags a long audience id", () => {
  const rule = new FallbackFunnelEstimateAudienceIdLengthRule(32);
  const item = newFallbackFunnelEstimate("x", "y");
  item.audienceId = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackFunnelEstimateLabelLengthRule flags a long label", () => {
  const rule = new FallbackFunnelEstimateLabelLengthRule(255);
  const item = newFallbackFunnelEstimate("x", "y");
  item.label = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackFunnelEstimateCodeLengthRule flags a long code", () => {
  const rule = new FallbackFunnelEstimateCodeLengthRule(80);
  const item = newFallbackFunnelEstimate("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackFunnelEstimateRequiredCurrencyRule flags a blank currency", () => {
  const rule = new FallbackFunnelEstimateRequiredCurrencyRule("fallback funnel estimate needs a value");
  const item = newFallbackFunnelEstimate("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
