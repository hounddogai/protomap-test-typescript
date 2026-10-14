import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingPaywallAuditRequiredLabelRule,
  PendingPaywallAuditRetriesRangeRule,
  PendingPaywallAuditSendAtRangeRule,
  PendingPaywallAuditSourceLengthRule,
  defaultPendingPaywallAuditValidator,
} from "./pending-paywall-audit-rules.js";
import { newPendingPaywallAudit } from "./pending-paywall-audit.js";

test("PendingPaywallAuditValidator reports every problem", () => {
  const validator = defaultPendingPaywallAuditValidator();
  const item = newPendingPaywallAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingPaywallAuditSourceLengthRule flags a long source", () => {
  const rule = new PendingPaywallAuditSourceLengthRule(86400);
  const item = newPendingPaywallAudit("x", "y");
  item.source = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingPaywallAuditRetriesRangeRule flags values above retries", () => {
  const rule = new PendingPaywallAuditRetriesRangeRule(64, 80);
  const item = newPendingPaywallAudit("x", "y");
  item.retries = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingPaywallAuditSendAtRangeRule flags values above send at", () => {
  const rule = new PendingPaywallAuditSendAtRangeRule(1000, 86400);
  const item = newPendingPaywallAudit("x", "y");
  item.sendAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingPaywallAuditRequiredLabelRule flags a blank label", () => {
  const rule = new PendingPaywallAuditRequiredLabelRule("pending paywall audit needs an entry");
  const item = newPendingPaywallAudit("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
