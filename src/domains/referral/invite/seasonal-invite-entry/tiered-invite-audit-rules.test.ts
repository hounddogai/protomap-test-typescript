import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredInviteAuditPriorityRangeRule,
  TieredInviteAuditRequiredCodeRule,
  TieredInviteAuditSendAtRangeRule,
  TieredInviteAuditUpdatedAtRangeRule,
  defaultTieredInviteAuditValidator,
} from "./tiered-invite-audit-rules.js";
import { newTieredInviteAudit } from "./tiered-invite-audit.js";

test("TieredInviteAuditValidator reports every problem", () => {
  const validator = defaultTieredInviteAuditValidator();
  const item = newTieredInviteAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredInviteAuditPriorityRangeRule flags values above priority", () => {
  const rule = new TieredInviteAuditPriorityRangeRule(120, 255);
  const item = newTieredInviteAudit("x", "y");
  item.priority = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredInviteAuditUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new TieredInviteAuditUpdatedAtRangeRule(120, 255);
  const item = newTieredInviteAudit("x", "y");
  item.updatedAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredInviteAuditSendAtRangeRule flags values above send at", () => {
  const rule = new TieredInviteAuditSendAtRangeRule(32, 3600);
  const item = newTieredInviteAudit("x", "y");
  item.sendAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredInviteAuditRequiredCodeRule flags a blank code", () => {
  const rule = new TieredInviteAuditRequiredCodeRule("tiered invite audit needs an entry");
  const item = newTieredInviteAudit("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
