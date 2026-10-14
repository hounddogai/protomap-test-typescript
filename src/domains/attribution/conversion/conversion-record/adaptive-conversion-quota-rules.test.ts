import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveConversionQuotaMaximumRangeRule,
  AdaptiveConversionQuotaRequiredCurrencyRule,
  AdaptiveConversionQuotaTitleLengthRule,
  defaultAdaptiveConversionQuotaValidator,
} from "./adaptive-conversion-quota-rules.js";
import { newAdaptiveConversionQuota } from "./adaptive-conversion-quota.js";

test("AdaptiveConversionQuotaValidator reports every problem", () => {
  const validator = defaultAdaptiveConversionQuotaValidator();
  const item = newAdaptiveConversionQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveConversionQuotaTitleLengthRule flags a long title", () => {
  const rule = new AdaptiveConversionQuotaTitleLengthRule(120);
  const item = newAdaptiveConversionQuota("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveConversionQuotaMaximumRangeRule flags values above maximum", () => {
  const rule = new AdaptiveConversionQuotaMaximumRangeRule(2.3, 2324.8);
  const item = newAdaptiveConversionQuota("x", "y");
  item.maximum = 2326.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveConversionQuotaRequiredCurrencyRule flags a blank currency", () => {
  const rule = new AdaptiveConversionQuotaRequiredCurrencyRule("adaptive conversion quota needs an entry");
  const item = newAdaptiveConversionQuota("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
