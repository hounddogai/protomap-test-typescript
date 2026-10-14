import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingLevelQuotaCodeLengthRule,
  PendingLevelQuotaRequiredLabelRule,
  PendingLevelQuotaRequiredSummaryRule,
  PendingLevelQuotaSummaryLengthRule,
  defaultPendingLevelQuotaValidator,
} from "./pending-level-quota-rules.js";
import { newPendingLevelQuota } from "./pending-level-quota.js";

test("PendingLevelQuotaValidator reports every problem", () => {
  const validator = defaultPendingLevelQuotaValidator();
  const item = newPendingLevelQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingLevelQuotaRequiredSummaryRule flags a blank summary", () => {
  const rule = new PendingLevelQuotaRequiredSummaryRule("pending level quota needs a value");
  const item = newPendingLevelQuota("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingLevelQuotaSummaryLengthRule flags a long summary", () => {
  const rule = new PendingLevelQuotaSummaryLengthRule(86400);
  const item = newPendingLevelQuota("x", "y");
  item.summary = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingLevelQuotaCodeLengthRule flags a long code", () => {
  const rule = new PendingLevelQuotaCodeLengthRule(16);
  const item = newPendingLevelQuota("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingLevelQuotaRequiredLabelRule flags a blank label", () => {
  const rule = new PendingLevelQuotaRequiredLabelRule("pending level quota needs a value");
  const item = newPendingLevelQuota("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
