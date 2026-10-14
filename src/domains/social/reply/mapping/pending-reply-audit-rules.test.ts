import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingReplyAuditNameLengthRule,
  PendingReplyAuditRequiredNameRule,
  PendingReplyAuditSourceLengthRule,
  defaultPendingReplyAuditValidator,
} from "./pending-reply-audit-rules.js";
import { newPendingReplyAudit } from "./pending-reply-audit.js";

test("PendingReplyAuditValidator reports every problem", () => {
  const validator = defaultPendingReplyAuditValidator();
  const item = newPendingReplyAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingReplyAuditRequiredNameRule flags a blank name", () => {
  const rule = new PendingReplyAuditRequiredNameRule("pending reply audit needs a value");
  const item = newPendingReplyAudit("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingReplyAuditNameLengthRule flags a long name", () => {
  const rule = new PendingReplyAuditNameLengthRule(16);
  const item = newPendingReplyAudit("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingReplyAuditSourceLengthRule flags a long source", () => {
  const rule = new PendingReplyAuditSourceLengthRule(3600);
  const item = newPendingReplyAudit("x", "y");
  item.source = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
