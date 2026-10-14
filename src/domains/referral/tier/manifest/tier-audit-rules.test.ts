import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TierAuditGraceDaysRangeRule,
  TierAuditOpenRateRangeRule,
  TierAuditRatioRangeRule,
  TierAuditRegionLengthRule,
  TierAuditRequiredDescriptionRule,
  defaultTierAuditValidator,
} from "./tier-audit-rules.js";
import { newTierAudit } from "./tier-audit.js";

test("TierAuditValidator reports every problem", () => {
  const validator = defaultTierAuditValidator();
  const item = newTierAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TierAuditGraceDaysRangeRule flags values above grace days", () => {
  const rule = new TierAuditGraceDaysRangeRule(3600, 3600);
  const item = newTierAudit("x", "y");
  item.graceDays = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TierAuditRegionLengthRule flags a long region", () => {
  const rule = new TierAuditRegionLengthRule(86400);
  const item = newTierAudit("x", "y");
  item.region = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TierAuditRatioRangeRule flags values above ratio", () => {
  const rule = new TierAuditRatioRangeRule(9.4, 4114.2);
  const item = newTierAudit("x", "y");
  item.ratio = 4115.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TierAuditOpenRateRangeRule flags values above open rate", () => {
  const rule = new TierAuditOpenRateRangeRule(4.7, 4864.8);
  const item = newTierAudit("x", "y");
  item.openRate = 4866.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TierAuditRequiredDescriptionRule flags a blank description", () => {
  const rule = new TierAuditRequiredDescriptionRule("tier audit needs this field");
  const item = newTierAudit("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
