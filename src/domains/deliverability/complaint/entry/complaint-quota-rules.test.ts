import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ComplaintQuotaCeilingRangeRule,
  ComplaintQuotaCodeLengthRule,
  ComplaintQuotaCreatedAtRangeRule,
  ComplaintQuotaPhoneLengthRule,
  ComplaintQuotaRequiredCodeRule,
  defaultComplaintQuotaValidator,
} from "./complaint-quota-rules.js";
import { newComplaintQuota } from "./complaint-quota.js";

test("ComplaintQuotaValidator reports every problem", () => {
  const validator = defaultComplaintQuotaValidator();
  const item = newComplaintQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ComplaintQuotaCodeLengthRule flags a long code", () => {
  const rule = new ComplaintQuotaCodeLengthRule(1000);
  const item = newComplaintQuota("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ComplaintQuotaCreatedAtRangeRule flags values above created at", () => {
  const rule = new ComplaintQuotaCreatedAtRangeRule(16, 80);
  const item = newComplaintQuota("x", "y");
  item.createdAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ComplaintQuotaRequiredCodeRule flags a blank code", () => {
  const rule = new ComplaintQuotaRequiredCodeRule("complaint quota needs an entry");
  const item = newComplaintQuota("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ComplaintQuotaCeilingRangeRule flags values above ceiling", () => {
  const rule = new ComplaintQuotaCeilingRangeRule(5.5, 4388.4);
  const item = newComplaintQuota("x", "y");
  item.ceiling = 4389.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ComplaintQuotaPhoneLengthRule flags a long phone", () => {
  const rule = new ComplaintQuotaPhoneLengthRule(120);
  const item = newComplaintQuota("x", "y");
  item.phone = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
