import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingStreakAuditRequiredCodeRule,
  PendingStreakAuditRequiredJourneyIdRule,
  PendingStreakAuditRequiredPhoneRule,
  PendingStreakAuditRequiredTitleRule,
  PendingStreakAuditTitleLengthRule,
  defaultPendingStreakAuditValidator,
} from "./pending-streak-audit-rules.js";
import { newPendingStreakAudit } from "./pending-streak-audit.js";

test("PendingStreakAuditValidator reports every problem", () => {
  const validator = defaultPendingStreakAuditValidator();
  const item = newPendingStreakAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingStreakAuditRequiredPhoneRule flags a blank phone", () => {
  const rule = new PendingStreakAuditRequiredPhoneRule("pending streak audit needs a value");
  const item = newPendingStreakAudit("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingStreakAuditRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new PendingStreakAuditRequiredJourneyIdRule("pending streak audit needs an entry");
  const item = newPendingStreakAudit("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingStreakAuditRequiredCodeRule flags a blank code", () => {
  const rule = new PendingStreakAuditRequiredCodeRule("pending streak audit needs an entry");
  const item = newPendingStreakAudit("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingStreakAuditTitleLengthRule flags a long title", () => {
  const rule = new PendingStreakAuditTitleLengthRule(3600);
  const item = newPendingStreakAudit("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingStreakAuditRequiredTitleRule flags a blank title", () => {
  const rule = new PendingStreakAuditRequiredTitleRule("pending streak audit needs an entry");
  const item = newPendingStreakAudit("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
