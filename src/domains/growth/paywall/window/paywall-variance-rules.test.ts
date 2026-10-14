import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PaywallVarianceCapacityRangeRule,
  PaywallVarianceCodeLengthRule,
  PaywallVarianceConversionRateRangeRule,
  PaywallVarianceLocaleLengthRule,
  defaultPaywallVarianceValidator,
} from "./paywall-variance-rules.js";
import { newPaywallVariance } from "./paywall-variance.js";

test("PaywallVarianceValidator reports every problem", () => {
  const validator = defaultPaywallVarianceValidator();
  const item = newPaywallVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PaywallVarianceCodeLengthRule flags a long code", () => {
  const rule = new PaywallVarianceCodeLengthRule(120);
  const item = newPaywallVariance("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PaywallVarianceCapacityRangeRule flags values above capacity", () => {
  const rule = new PaywallVarianceCapacityRangeRule(32, 80);
  const item = newPaywallVariance("x", "y");
  item.capacity = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PaywallVarianceLocaleLengthRule flags a long locale", () => {
  const rule = new PaywallVarianceLocaleLengthRule(64);
  const item = newPaywallVariance("x", "y");
  item.locale = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PaywallVarianceConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new PaywallVarianceConversionRateRangeRule(0.3, 2361.8);
  const item = newPaywallVariance("x", "y");
  item.conversionRate = 2363.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
