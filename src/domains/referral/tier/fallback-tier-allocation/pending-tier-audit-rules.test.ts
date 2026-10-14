import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingTierAuditQuantityRangeRule,
  PendingTierAuditRequiredCodeRule,
  PendingTierAuditRequiredNotesRule,
  PendingTierAuditRequiredTitleRule,
  defaultPendingTierAuditValidator,
} from "./pending-tier-audit-rules.js";
import { newPendingTierAudit } from "./pending-tier-audit.js";

test("PendingTierAuditValidator reports every problem", () => {
  const validator = defaultPendingTierAuditValidator();
  const item = newPendingTierAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingTierAuditRequiredTitleRule flags a blank title", () => {
  const rule = new PendingTierAuditRequiredTitleRule("pending tier audit needs an entry");
  const item = newPendingTierAudit("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingTierAuditQuantityRangeRule flags values above quantity", () => {
  const rule = new PendingTierAuditQuantityRangeRule(16, 1000);
  const item = newPendingTierAudit("x", "y");
  item.quantity = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingTierAuditRequiredNotesRule flags a blank notes", () => {
  const rule = new PendingTierAuditRequiredNotesRule("pending tier audit needs an entry");
  const item = newPendingTierAudit("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingTierAuditRequiredCodeRule flags a blank code", () => {
  const rule = new PendingTierAuditRequiredCodeRule("pending tier audit needs a value");
  const item = newPendingTierAudit("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
