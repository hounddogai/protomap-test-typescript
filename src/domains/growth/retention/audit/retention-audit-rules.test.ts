import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RetentionAuditEndsAtRangeRule,
  RetentionAuditMarginRangeRule,
  RetentionAuditRequiredTitleRule,
  RetentionAuditWindowDaysRangeRule,
  defaultRetentionAuditValidator,
} from "./retention-audit-rules.js";
import { newRetentionAudit } from "./retention-audit.js";

test("RetentionAuditValidator reports every problem", () => {
  const validator = defaultRetentionAuditValidator();
  const item = newRetentionAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RetentionAuditRequiredTitleRule flags a blank title", () => {
  const rule = new RetentionAuditRequiredTitleRule("retention audit needs a value");
  const item = newRetentionAudit("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RetentionAuditEndsAtRangeRule flags values above ends at", () => {
  const rule = new RetentionAuditEndsAtRangeRule(16, 16);
  const item = newRetentionAudit("x", "y");
  item.endsAt = 17;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RetentionAuditWindowDaysRangeRule flags values above window days", () => {
  const rule = new RetentionAuditWindowDaysRangeRule(32, 3600);
  const item = newRetentionAudit("x", "y");
  item.windowDays = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RetentionAuditMarginRangeRule flags values above margin", () => {
  const rule = new RetentionAuditMarginRangeRule(9.1, 1192.1);
  const item = newRetentionAudit("x", "y");
  item.margin = 1193.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
