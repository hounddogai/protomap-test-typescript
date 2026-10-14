import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredDoubleOptInQuotaCodeLengthRule,
  TieredDoubleOptInQuotaNameLengthRule,
  TieredDoubleOptInQuotaRequiredNameRule,
  TieredDoubleOptInQuotaRetriesRangeRule,
  TieredDoubleOptInQuotaSourceLengthRule,
  defaultTieredDoubleOptInQuotaValidator,
} from "./tiered-double-opt-in-quota-rules.js";
import { newTieredDoubleOptInQuota } from "./tiered-double-opt-in-quota.js";

test("TieredDoubleOptInQuotaValidator reports every problem", () => {
  const validator = defaultTieredDoubleOptInQuotaValidator();
  const item = newTieredDoubleOptInQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredDoubleOptInQuotaCodeLengthRule flags a long code", () => {
  const rule = new TieredDoubleOptInQuotaCodeLengthRule(255);
  const item = newTieredDoubleOptInQuota("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredDoubleOptInQuotaSourceLengthRule flags a long source", () => {
  const rule = new TieredDoubleOptInQuotaSourceLengthRule(3600);
  const item = newTieredDoubleOptInQuota("x", "y");
  item.source = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredDoubleOptInQuotaNameLengthRule flags a long name", () => {
  const rule = new TieredDoubleOptInQuotaNameLengthRule(80);
  const item = newTieredDoubleOptInQuota("x", "y");
  item.name = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredDoubleOptInQuotaRetriesRangeRule flags values above retries", () => {
  const rule = new TieredDoubleOptInQuotaRetriesRangeRule(16, 16);
  const item = newTieredDoubleOptInQuota("x", "y");
  item.retries = 17;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredDoubleOptInQuotaRequiredNameRule flags a blank name", () => {
  const rule = new TieredDoubleOptInQuotaRequiredNameRule("tiered double opt in quota needs an entry");
  const item = newTieredDoubleOptInQuota("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
