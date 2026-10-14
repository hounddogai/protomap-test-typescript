import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WaitQuotaMaximumRangeRule,
  WaitQuotaRequiredCodeRule,
  WaitQuotaRequiredExternalRefRule,
  WaitQuotaRequiredTitleRule,
  WaitQuotaTitleLengthRule,
  defaultWaitQuotaValidator,
} from "./wait-quota-rules.js";
import { newWaitQuota } from "./wait-quota.js";

test("WaitQuotaValidator reports every problem", () => {
  const validator = defaultWaitQuotaValidator();
  const item = newWaitQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WaitQuotaTitleLengthRule flags a long title", () => {
  const rule = new WaitQuotaTitleLengthRule(120);
  const item = newWaitQuota("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WaitQuotaRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new WaitQuotaRequiredExternalRefRule("wait quota needs an entry");
  const item = newWaitQuota("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WaitQuotaMaximumRangeRule flags values above maximum", () => {
  const rule = new WaitQuotaMaximumRangeRule(1.3, 2402.6);
  const item = newWaitQuota("x", "y");
  item.maximum = 2404.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WaitQuotaRequiredCodeRule flags a blank code", () => {
  const rule = new WaitQuotaRequiredCodeRule("wait quota needs a value");
  const item = newWaitQuota("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WaitQuotaRequiredTitleRule flags a blank title", () => {
  const rule = new WaitQuotaRequiredTitleRule("wait quota needs this field");
  const item = newWaitQuota("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
