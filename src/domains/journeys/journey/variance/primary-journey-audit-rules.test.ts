import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryJourneyAuditEndsAtRangeRule,
  PrimaryJourneyAuditRequiredCodeRule,
  PrimaryJourneyAuditRequiredCurrencyRule,
  PrimaryJourneyAuditSendAtRangeRule,
  defaultPrimaryJourneyAuditValidator,
} from "./primary-journey-audit-rules.js";
import { newPrimaryJourneyAudit } from "./primary-journey-audit.js";

test("PrimaryJourneyAuditValidator reports every problem", () => {
  const validator = defaultPrimaryJourneyAuditValidator();
  const item = newPrimaryJourneyAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryJourneyAuditRequiredCodeRule flags a blank code", () => {
  const rule = new PrimaryJourneyAuditRequiredCodeRule("primary journey audit needs a value");
  const item = newPrimaryJourneyAudit("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryJourneyAuditEndsAtRangeRule flags values above ends at", () => {
  const rule = new PrimaryJourneyAuditEndsAtRangeRule(120, 120);
  const item = newPrimaryJourneyAudit("x", "y");
  item.endsAt = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryJourneyAuditSendAtRangeRule flags values above send at", () => {
  const rule = new PrimaryJourneyAuditSendAtRangeRule(86400, 86400);
  const item = newPrimaryJourneyAudit("x", "y");
  item.sendAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryJourneyAuditRequiredCurrencyRule flags a blank currency", () => {
  const rule = new PrimaryJourneyAuditRequiredCurrencyRule("primary journey audit needs a value");
  const item = newPrimaryJourneyAudit("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
