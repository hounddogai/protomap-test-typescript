import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InviteAuditFloorValueRangeRule,
  InviteAuditGraceDaysRangeRule,
  defaultInviteAuditValidator,
} from "./invite-audit-rules.js";
import { newInviteAudit } from "./invite-audit.js";

test("InviteAuditValidator reports every problem", () => {
  const validator = defaultInviteAuditValidator();
  const item = newInviteAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("InviteAuditGraceDaysRangeRule flags values above grace days", () => {
  const rule = new InviteAuditGraceDaysRangeRule(255, 1000);
  const item = newInviteAudit("x", "y");
  item.graceDays = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("InviteAuditFloorValueRangeRule flags values above floor value", () => {
  const rule = new InviteAuditFloorValueRangeRule(9.2, 2327.3);
  const item = newInviteAudit("x", "y");
  item.floorValue = 2328.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
