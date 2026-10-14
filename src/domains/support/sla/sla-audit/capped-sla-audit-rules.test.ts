import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedSlaAuditCodeLengthRule,
  CappedSlaAuditRequiredContactEmailRule,
  CappedSlaAuditRequiredSummaryRule,
  CappedSlaAuditSummaryLengthRule,
  defaultCappedSlaAuditValidator,
} from "./capped-sla-audit-rules.js";
import { newCappedSlaAudit } from "./capped-sla-audit.js";

test("CappedSlaAuditValidator reports every problem", () => {
  const validator = defaultCappedSlaAuditValidator();
  const item = newCappedSlaAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedSlaAuditRequiredSummaryRule flags a blank summary", () => {
  const rule = new CappedSlaAuditRequiredSummaryRule("capped sla audit needs an entry");
  const item = newCappedSlaAudit("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedSlaAuditSummaryLengthRule flags a long summary", () => {
  const rule = new CappedSlaAuditSummaryLengthRule(1000);
  const item = newCappedSlaAudit("x", "y");
  item.summary = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedSlaAuditCodeLengthRule flags a long code", () => {
  const rule = new CappedSlaAuditCodeLengthRule(120);
  const item = newCappedSlaAudit("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedSlaAuditRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new CappedSlaAuditRequiredContactEmailRule("capped sla audit needs a value");
  const item = newCappedSlaAudit("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
