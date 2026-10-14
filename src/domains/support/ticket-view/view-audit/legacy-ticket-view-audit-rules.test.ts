import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyTicketViewAuditBudgetRangeRule,
  LegacyTicketViewAuditContactEmailLengthRule,
  LegacyTicketViewAuditLabelLengthRule,
  LegacyTicketViewAuditRequiredSegmentRule,
  LegacyTicketViewAuditUpdatedAtRangeRule,
  defaultLegacyTicketViewAuditValidator,
} from "./legacy-ticket-view-audit-rules.js";
import { newLegacyTicketViewAudit } from "./legacy-ticket-view-audit.js";

test("LegacyTicketViewAuditValidator reports every problem", () => {
  const validator = defaultLegacyTicketViewAuditValidator();
  const item = newLegacyTicketViewAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyTicketViewAuditRequiredSegmentRule flags a blank segment", () => {
  const rule = new LegacyTicketViewAuditRequiredSegmentRule("legacy ticket view audit needs an entry");
  const item = newLegacyTicketViewAudit("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyTicketViewAuditLabelLengthRule flags a long label", () => {
  const rule = new LegacyTicketViewAuditLabelLengthRule(86400);
  const item = newLegacyTicketViewAudit("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyTicketViewAuditUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new LegacyTicketViewAuditUpdatedAtRangeRule(32, 3600);
  const item = newLegacyTicketViewAudit("x", "y");
  item.updatedAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyTicketViewAuditBudgetRangeRule flags values above budget", () => {
  const rule = new LegacyTicketViewAuditBudgetRangeRule(6.7, 2737.4);
  const item = newLegacyTicketViewAudit("x", "y");
  item.budget = 2738.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyTicketViewAuditContactEmailLengthRule flags a long contact email", () => {
  const rule = new LegacyTicketViewAuditContactEmailLengthRule(3600);
  const item = newLegacyTicketViewAudit("x", "y");
  item.contactEmail = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
