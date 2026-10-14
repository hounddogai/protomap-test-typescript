import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledBounceQuotaBidRangeRule,
  ScheduledBounceQuotaCodeLengthRule,
  ScheduledBounceQuotaExpiresAtRangeRule,
  ScheduledBounceQuotaRequiredUtmSourceRule,
  ScheduledBounceQuotaWeightRangeRule,
  defaultScheduledBounceQuotaValidator,
} from "./scheduled-bounce-quota-rules.js";
import { newScheduledBounceQuota } from "./scheduled-bounce-quota.js";

test("ScheduledBounceQuotaValidator reports every problem", () => {
  const validator = defaultScheduledBounceQuotaValidator();
  const item = newScheduledBounceQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledBounceQuotaBidRangeRule flags values above bid", () => {
  const rule = new ScheduledBounceQuotaBidRangeRule(7.1, 2542.6);
  const item = newScheduledBounceQuota("x", "y");
  item.bid = 2544.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledBounceQuotaRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new ScheduledBounceQuotaRequiredUtmSourceRule("scheduled bounce quota needs a value");
  const item = newScheduledBounceQuota("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledBounceQuotaCodeLengthRule flags a long code", () => {
  const rule = new ScheduledBounceQuotaCodeLengthRule(32);
  const item = newScheduledBounceQuota("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledBounceQuotaExpiresAtRangeRule flags values above expires at", () => {
  const rule = new ScheduledBounceQuotaExpiresAtRangeRule(64, 86400);
  const item = newScheduledBounceQuota("x", "y");
  item.expiresAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledBounceQuotaWeightRangeRule flags values above weight", () => {
  const rule = new ScheduledBounceQuotaWeightRangeRule(7.5, 857.7);
  const item = newScheduledBounceQuota("x", "y");
  item.weight = 859.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
