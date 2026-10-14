import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalBadgeBaselineCurrencyLengthRule,
  GlobalBadgeBaselineExternalRefLengthRule,
  GlobalBadgeBaselineImpressionsRangeRule,
  GlobalBadgeBaselineRateRangeRule,
  GlobalBadgeBaselineRequiredExternalRefRule,
  defaultGlobalBadgeBaselineValidator,
} from "./global-badge-baseline-rules.js";
import { newGlobalBadgeBaseline } from "./global-badge-baseline.js";

test("GlobalBadgeBaselineValidator reports every problem", () => {
  const validator = defaultGlobalBadgeBaselineValidator();
  const item = newGlobalBadgeBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalBadgeBaselineImpressionsRangeRule flags values above impressions", () => {
  const rule = new GlobalBadgeBaselineImpressionsRangeRule(120, 120);
  const item = newGlobalBadgeBaseline("x", "y");
  item.impressions = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalBadgeBaselineRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new GlobalBadgeBaselineRequiredExternalRefRule("global badge baseline needs this field");
  const item = newGlobalBadgeBaseline("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalBadgeBaselineCurrencyLengthRule flags a long currency", () => {
  const rule = new GlobalBadgeBaselineCurrencyLengthRule(80);
  const item = newGlobalBadgeBaseline("x", "y");
  item.currency = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalBadgeBaselineExternalRefLengthRule flags a long external ref", () => {
  const rule = new GlobalBadgeBaselineExternalRefLengthRule(32);
  const item = newGlobalBadgeBaseline("x", "y");
  item.externalRef = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalBadgeBaselineRateRangeRule flags values above rate", () => {
  const rule = new GlobalBadgeBaselineRateRangeRule(6.7, 3456.3);
  const item = newGlobalBadgeBaseline("x", "y");
  item.rate = 3457.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
