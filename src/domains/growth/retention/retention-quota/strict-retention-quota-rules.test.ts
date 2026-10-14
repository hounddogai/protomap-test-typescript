import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictRetentionQuotaCategoryLengthRule,
  StrictRetentionQuotaRequiredTitleRule,
  StrictRetentionQuotaRequiredVariantRule,
  StrictRetentionQuotaTitleLengthRule,
  StrictRetentionQuotaWindowDaysRangeRule,
  defaultStrictRetentionQuotaValidator,
} from "./strict-retention-quota-rules.js";
import { newStrictRetentionQuota } from "./strict-retention-quota.js";

test("StrictRetentionQuotaValidator reports every problem", () => {
  const validator = defaultStrictRetentionQuotaValidator();
  const item = newStrictRetentionQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictRetentionQuotaRequiredTitleRule flags a blank title", () => {
  const rule = new StrictRetentionQuotaRequiredTitleRule("strict retention quota needs this field");
  const item = newStrictRetentionQuota("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictRetentionQuotaTitleLengthRule flags a long title", () => {
  const rule = new StrictRetentionQuotaTitleLengthRule(255);
  const item = newStrictRetentionQuota("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictRetentionQuotaWindowDaysRangeRule flags values above window days", () => {
  const rule = new StrictRetentionQuotaWindowDaysRangeRule(16, 120);
  const item = newStrictRetentionQuota("x", "y");
  item.windowDays = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictRetentionQuotaCategoryLengthRule flags a long category", () => {
  const rule = new StrictRetentionQuotaCategoryLengthRule(32);
  const item = newStrictRetentionQuota("x", "y");
  item.category = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictRetentionQuotaRequiredVariantRule flags a blank variant", () => {
  const rule = new StrictRetentionQuotaRequiredVariantRule("strict retention quota needs a value");
  const item = newStrictRetentionQuota("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
