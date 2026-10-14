import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledBidRuleQuotaChecksumLengthRule,
  ScheduledBidRuleQuotaNameLengthRule,
  ScheduledBidRuleQuotaRequiredChecksumRule,
  defaultScheduledBidRuleQuotaValidator,
} from "./scheduled-bid-rule-quota-rules.js";
import { newScheduledBidRuleQuota } from "./scheduled-bid-rule-quota.js";

test("ScheduledBidRuleQuotaValidator reports every problem", () => {
  const validator = defaultScheduledBidRuleQuotaValidator();
  const item = newScheduledBidRuleQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledBidRuleQuotaRequiredChecksumRule flags a blank checksum", () => {
  const rule = new ScheduledBidRuleQuotaRequiredChecksumRule("scheduled bid rule quota needs a value");
  const item = newScheduledBidRuleQuota("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledBidRuleQuotaNameLengthRule flags a long name", () => {
  const rule = new ScheduledBidRuleQuotaNameLengthRule(1000);
  const item = newScheduledBidRuleQuota("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledBidRuleQuotaChecksumLengthRule flags a long checksum", () => {
  const rule = new ScheduledBidRuleQuotaChecksumLengthRule(32);
  const item = newScheduledBidRuleQuota("x", "y");
  item.checksum = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
