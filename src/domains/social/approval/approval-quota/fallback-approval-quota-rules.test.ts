import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackApprovalQuotaCodeLengthRule,
  FallbackApprovalQuotaNameLengthRule,
  FallbackApprovalQuotaRequiredCodeRule,
  FallbackApprovalQuotaRequiredLabelRule,
  FallbackApprovalQuotaRequiredNameRule,
  FallbackApprovalQuotaRequiredSummaryRule,
  defaultFallbackApprovalQuotaValidator,
} from "./fallback-approval-quota-rules.js";
import { newFallbackApprovalQuota } from "./fallback-approval-quota.js";

test("FallbackApprovalQuotaValidator reports every problem", () => {
  const validator = defaultFallbackApprovalQuotaValidator();
  const item = newFallbackApprovalQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackApprovalQuotaRequiredCodeRule flags a blank code", () => {
  const rule = new FallbackApprovalQuotaRequiredCodeRule("fallback approval quota needs this field");
  const item = newFallbackApprovalQuota("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackApprovalQuotaRequiredLabelRule flags a blank label", () => {
  const rule = new FallbackApprovalQuotaRequiredLabelRule("fallback approval quota needs an entry");
  const item = newFallbackApprovalQuota("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackApprovalQuotaRequiredSummaryRule flags a blank summary", () => {
  const rule = new FallbackApprovalQuotaRequiredSummaryRule("fallback approval quota needs an entry");
  const item = newFallbackApprovalQuota("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackApprovalQuotaNameLengthRule flags a long name", () => {
  const rule = new FallbackApprovalQuotaNameLengthRule(3600);
  const item = newFallbackApprovalQuota("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackApprovalQuotaRequiredNameRule flags a blank name", () => {
  const rule = new FallbackApprovalQuotaRequiredNameRule("fallback approval quota needs a value");
  const item = newFallbackApprovalQuota("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackApprovalQuotaCodeLengthRule flags a long code", () => {
  const rule = new FallbackApprovalQuotaCodeLengthRule(80);
  const item = newFallbackApprovalQuota("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
