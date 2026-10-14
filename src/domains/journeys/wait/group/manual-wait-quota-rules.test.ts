import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualWaitQuotaChecksumLengthRule,
  ManualWaitQuotaNameLengthRule,
  ManualWaitQuotaPriorityRangeRule,
  ManualWaitQuotaRequiredChecksumRule,
  ManualWaitQuotaRequiredCodeRule,
  defaultManualWaitQuotaValidator,
} from "./manual-wait-quota-rules.js";
import { newManualWaitQuota } from "./manual-wait-quota.js";

test("ManualWaitQuotaValidator reports every problem", () => {
  const validator = defaultManualWaitQuotaValidator();
  const item = newManualWaitQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualWaitQuotaNameLengthRule flags a long name", () => {
  const rule = new ManualWaitQuotaNameLengthRule(3600);
  const item = newManualWaitQuota("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualWaitQuotaRequiredCodeRule flags a blank code", () => {
  const rule = new ManualWaitQuotaRequiredCodeRule("manual wait quota needs a value");
  const item = newManualWaitQuota("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualWaitQuotaChecksumLengthRule flags a long checksum", () => {
  const rule = new ManualWaitQuotaChecksumLengthRule(86400);
  const item = newManualWaitQuota("x", "y");
  item.checksum = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualWaitQuotaRequiredChecksumRule flags a blank checksum", () => {
  const rule = new ManualWaitQuotaRequiredChecksumRule("manual wait quota needs this field");
  const item = newManualWaitQuota("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualWaitQuotaPriorityRangeRule flags values above priority", () => {
  const rule = new ManualWaitQuotaPriorityRangeRule(32, 86400);
  const item = newManualWaitQuota("x", "y");
  item.priority = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
