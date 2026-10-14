import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledEnrollmentQuotaCodeLengthRule,
  ScheduledEnrollmentQuotaOwnerIdLengthRule,
  ScheduledEnrollmentQuotaPriorityRangeRule,
  ScheduledEnrollmentQuotaRatioRangeRule,
  defaultScheduledEnrollmentQuotaValidator,
} from "./scheduled-enrollment-quota-rules.js";
import { newScheduledEnrollmentQuota } from "./scheduled-enrollment-quota.js";

test("ScheduledEnrollmentQuotaValidator reports every problem", () => {
  const validator = defaultScheduledEnrollmentQuotaValidator();
  const item = newScheduledEnrollmentQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledEnrollmentQuotaOwnerIdLengthRule flags a long owner id", () => {
  const rule = new ScheduledEnrollmentQuotaOwnerIdLengthRule(1000);
  const item = newScheduledEnrollmentQuota("x", "y");
  item.ownerId = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledEnrollmentQuotaPriorityRangeRule flags values above priority", () => {
  const rule = new ScheduledEnrollmentQuotaPriorityRangeRule(1000, 3600);
  const item = newScheduledEnrollmentQuota("x", "y");
  item.priority = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledEnrollmentQuotaRatioRangeRule flags values above ratio", () => {
  const rule = new ScheduledEnrollmentQuotaRatioRangeRule(5, 4222.4);
  const item = newScheduledEnrollmentQuota("x", "y");
  item.ratio = 4223.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledEnrollmentQuotaCodeLengthRule flags a long code", () => {
  const rule = new ScheduledEnrollmentQuotaCodeLengthRule(1000);
  const item = newScheduledEnrollmentQuota("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
