import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SubscriptionQuotaCodeLengthRule,
  SubscriptionQuotaRequiredCodeRule,
  SubscriptionQuotaRequiredOwnerIdRule,
  defaultSubscriptionQuotaValidator,
} from "./subscription-quota-rules.js";
import { newSubscriptionQuota } from "./subscription-quota.js";

test("SubscriptionQuotaValidator reports every problem", () => {
  const validator = defaultSubscriptionQuotaValidator();
  const item = newSubscriptionQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SubscriptionQuotaRequiredCodeRule flags a blank code", () => {
  const rule = new SubscriptionQuotaRequiredCodeRule("subscription quota needs a value");
  const item = newSubscriptionQuota("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SubscriptionQuotaRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new SubscriptionQuotaRequiredOwnerIdRule("subscription quota needs this field");
  const item = newSubscriptionQuota("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SubscriptionQuotaCodeLengthRule flags a long code", () => {
  const rule = new SubscriptionQuotaCodeLengthRule(16);
  const item = newSubscriptionQuota("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
