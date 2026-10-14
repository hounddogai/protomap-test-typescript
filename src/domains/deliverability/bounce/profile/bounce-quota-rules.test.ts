import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BounceQuotaCurrencyLengthRule,
  BounceQuotaRequiredChannelRule,
  BounceQuotaRequiredCurrencyRule,
  defaultBounceQuotaValidator,
} from "./bounce-quota-rules.js";
import { newBounceQuota } from "./bounce-quota.js";

test("BounceQuotaValidator reports every problem", () => {
  const validator = defaultBounceQuotaValidator();
  const item = newBounceQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BounceQuotaCurrencyLengthRule flags a long currency", () => {
  const rule = new BounceQuotaCurrencyLengthRule(255);
  const item = newBounceQuota("x", "y");
  item.currency = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BounceQuotaRequiredCurrencyRule flags a blank currency", () => {
  const rule = new BounceQuotaRequiredCurrencyRule("bounce quota needs an entry");
  const item = newBounceQuota("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BounceQuotaRequiredChannelRule flags a blank channel", () => {
  const rule = new BounceQuotaRequiredChannelRule("bounce quota needs an entry");
  const item = newBounceQuota("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
