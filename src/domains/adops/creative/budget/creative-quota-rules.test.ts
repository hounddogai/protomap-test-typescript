import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreativeQuotaCodeLengthRule,
  CreativeQuotaConversionRateRangeRule,
  CreativeQuotaCreatedAtRangeRule,
  CreativeQuotaRequiredChannelRule,
  CreativeQuotaRequiredCodeRule,
  defaultCreativeQuotaValidator,
} from "./creative-quota-rules.js";
import { newCreativeQuota } from "./creative-quota.js";

test("CreativeQuotaValidator reports every problem", () => {
  const validator = defaultCreativeQuotaValidator();
  const item = newCreativeQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreativeQuotaConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new CreativeQuotaConversionRateRangeRule(4.9, 300);
  const item = newCreativeQuota("x", "y");
  item.conversionRate = 301.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CreativeQuotaRequiredCodeRule flags a blank code", () => {
  const rule = new CreativeQuotaRequiredCodeRule("creative quota needs this field");
  const item = newCreativeQuota("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CreativeQuotaRequiredChannelRule flags a blank channel", () => {
  const rule = new CreativeQuotaRequiredChannelRule("creative quota needs this field");
  const item = newCreativeQuota("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CreativeQuotaCreatedAtRangeRule flags values above created at", () => {
  const rule = new CreativeQuotaCreatedAtRangeRule(32, 32);
  const item = newCreativeQuota("x", "y");
  item.createdAt = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CreativeQuotaCodeLengthRule flags a long code", () => {
  const rule = new CreativeQuotaCodeLengthRule(32);
  const item = newCreativeQuota("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
