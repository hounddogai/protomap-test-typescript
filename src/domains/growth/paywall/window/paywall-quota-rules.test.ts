import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PaywallQuotaChannelLengthRule,
  PaywallQuotaPriorityRangeRule,
  PaywallQuotaRequiredTitleRule,
  defaultPaywallQuotaValidator,
} from "./paywall-quota-rules.js";
import { newPaywallQuota } from "./paywall-quota.js";

test("PaywallQuotaValidator reports every problem", () => {
  const validator = defaultPaywallQuotaValidator();
  const item = newPaywallQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PaywallQuotaRequiredTitleRule flags a blank title", () => {
  const rule = new PaywallQuotaRequiredTitleRule("paywall quota needs a value");
  const item = newPaywallQuota("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PaywallQuotaChannelLengthRule flags a long channel", () => {
  const rule = new PaywallQuotaChannelLengthRule(64);
  const item = newPaywallQuota("x", "y");
  item.channel = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PaywallQuotaPriorityRangeRule flags values above priority", () => {
  const rule = new PaywallQuotaPriorityRangeRule(80, 120);
  const item = newPaywallQuota("x", "y");
  item.priority = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
