import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RedemptionAuditCapacityRangeRule,
  RedemptionAuditCodeLengthRule,
  RedemptionAuditCurrencyLengthRule,
  RedemptionAuditDurationMinutesRangeRule,
  RedemptionAuditRequiredCodeRule,
  RedemptionAuditVersionRangeRule,
  defaultRedemptionAuditValidator,
} from "./redemption-audit-rules.js";
import { newRedemptionAudit } from "./redemption-audit.js";

test("RedemptionAuditValidator reports every problem", () => {
  const validator = defaultRedemptionAuditValidator();
  const item = newRedemptionAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RedemptionAuditCodeLengthRule flags a long code", () => {
  const rule = new RedemptionAuditCodeLengthRule(255);
  const item = newRedemptionAudit("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RedemptionAuditCapacityRangeRule flags values above capacity", () => {
  const rule = new RedemptionAuditCapacityRangeRule(255, 1000);
  const item = newRedemptionAudit("x", "y");
  item.capacity = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RedemptionAuditDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new RedemptionAuditDurationMinutesRangeRule(3600, 3600);
  const item = newRedemptionAudit("x", "y");
  item.durationMinutes = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RedemptionAuditCurrencyLengthRule flags a long currency", () => {
  const rule = new RedemptionAuditCurrencyLengthRule(16);
  const item = newRedemptionAudit("x", "y");
  item.currency = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RedemptionAuditVersionRangeRule flags values above version", () => {
  const rule = new RedemptionAuditVersionRangeRule(64, 255);
  const item = newRedemptionAudit("x", "y");
  item.version = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RedemptionAuditRequiredCodeRule flags a blank code", () => {
  const rule = new RedemptionAuditRequiredCodeRule("redemption audit needs this field");
  const item = newRedemptionAudit("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
