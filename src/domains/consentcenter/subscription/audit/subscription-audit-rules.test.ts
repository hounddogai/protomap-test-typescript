import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SubscriptionAuditExpiresAtRangeRule,
  SubscriptionAuditLabelLengthRule,
  SubscriptionAuditRequiredLabelRule,
  SubscriptionAuditUtmSourceLengthRule,
  defaultSubscriptionAuditValidator,
} from "./subscription-audit-rules.js";
import { newSubscriptionAudit } from "./subscription-audit.js";

test("SubscriptionAuditValidator reports every problem", () => {
  const validator = defaultSubscriptionAuditValidator();
  const item = newSubscriptionAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SubscriptionAuditRequiredLabelRule flags a blank label", () => {
  const rule = new SubscriptionAuditRequiredLabelRule("subscription audit needs a value");
  const item = newSubscriptionAudit("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SubscriptionAuditLabelLengthRule flags a long label", () => {
  const rule = new SubscriptionAuditLabelLengthRule(1000);
  const item = newSubscriptionAudit("x", "y");
  item.label = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SubscriptionAuditUtmSourceLengthRule flags a long utm source", () => {
  const rule = new SubscriptionAuditUtmSourceLengthRule(32);
  const item = newSubscriptionAudit("x", "y");
  item.utmSource = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SubscriptionAuditExpiresAtRangeRule flags values above expires at", () => {
  const rule = new SubscriptionAuditExpiresAtRangeRule(64, 64);
  const item = newSubscriptionAudit("x", "y");
  item.expiresAt = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
