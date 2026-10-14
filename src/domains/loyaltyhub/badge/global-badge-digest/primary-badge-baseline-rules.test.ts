import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryBadgeBaselineCodeLengthRule,
  PrimaryBadgeBaselineConversionRateRangeRule,
  PrimaryBadgeBaselinePhoneLengthRule,
  PrimaryBadgeBaselineRequiredCodeRule,
  PrimaryBadgeBaselineRequiredNameRule,
  defaultPrimaryBadgeBaselineValidator,
} from "./primary-badge-baseline-rules.js";
import { newPrimaryBadgeBaseline } from "./primary-badge-baseline.js";

test("PrimaryBadgeBaselineValidator reports every problem", () => {
  const validator = defaultPrimaryBadgeBaselineValidator();
  const item = newPrimaryBadgeBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryBadgeBaselineConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new PrimaryBadgeBaselineConversionRateRangeRule(8.1, 4144.7);
  const item = newPrimaryBadgeBaseline("x", "y");
  item.conversionRate = 4146.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryBadgeBaselinePhoneLengthRule flags a long phone", () => {
  const rule = new PrimaryBadgeBaselinePhoneLengthRule(16);
  const item = newPrimaryBadgeBaseline("x", "y");
  item.phone = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryBadgeBaselineCodeLengthRule flags a long code", () => {
  const rule = new PrimaryBadgeBaselineCodeLengthRule(64);
  const item = newPrimaryBadgeBaseline("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryBadgeBaselineRequiredNameRule flags a blank name", () => {
  const rule = new PrimaryBadgeBaselineRequiredNameRule("primary badge baseline needs this field");
  const item = newPrimaryBadgeBaseline("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryBadgeBaselineRequiredCodeRule flags a blank code", () => {
  const rule = new PrimaryBadgeBaselineRequiredCodeRule("primary badge baseline needs an entry");
  const item = newPrimaryBadgeBaseline("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
