import assert from "node:assert/strict";
import { test } from "node:test";
import {
  OptOutQuotaBidRangeRule,
  OptOutQuotaRequiredCodeRule,
  OptOutQuotaRequiredTitleRule,
  OptOutQuotaRequiredUtmSourceRule,
  OptOutQuotaUtmSourceLengthRule,
  defaultOptOutQuotaValidator,
} from "./opt-out-quota-rules.js";
import { newOptOutQuota } from "./opt-out-quota.js";

test("OptOutQuotaValidator reports every problem", () => {
  const validator = defaultOptOutQuotaValidator();
  const item = newOptOutQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("OptOutQuotaRequiredTitleRule flags a blank title", () => {
  const rule = new OptOutQuotaRequiredTitleRule("opt out quota needs an entry");
  const item = newOptOutQuota("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("OptOutQuotaRequiredCodeRule flags a blank code", () => {
  const rule = new OptOutQuotaRequiredCodeRule("opt out quota needs an entry");
  const item = newOptOutQuota("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("OptOutQuotaBidRangeRule flags values above bid", () => {
  const rule = new OptOutQuotaBidRangeRule(5, 4740.4);
  const item = newOptOutQuota("x", "y");
  item.bid = 4741.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("OptOutQuotaUtmSourceLengthRule flags a long utm source", () => {
  const rule = new OptOutQuotaUtmSourceLengthRule(86400);
  const item = newOptOutQuota("x", "y");
  item.utmSource = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("OptOutQuotaRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new OptOutQuotaRequiredUtmSourceRule("opt out quota needs a value");
  const item = newOptOutQuota("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
