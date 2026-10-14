import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SenderAuditNameLengthRule,
  SenderAuditRequiredCodeRule,
  SenderAuditRequiredReviewerRule,
  SenderAuditRequiredSegmentRule,
  SenderAuditSegmentLengthRule,
  defaultSenderAuditValidator,
} from "./sender-audit-rules.js";
import { newSenderAudit } from "./sender-audit.js";

test("SenderAuditValidator reports every problem", () => {
  const validator = defaultSenderAuditValidator();
  const item = newSenderAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SenderAuditRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new SenderAuditRequiredReviewerRule("sender audit needs an entry");
  const item = newSenderAudit("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SenderAuditRequiredCodeRule flags a blank code", () => {
  const rule = new SenderAuditRequiredCodeRule("sender audit needs an entry");
  const item = newSenderAudit("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SenderAuditNameLengthRule flags a long name", () => {
  const rule = new SenderAuditNameLengthRule(1000);
  const item = newSenderAudit("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SenderAuditSegmentLengthRule flags a long segment", () => {
  const rule = new SenderAuditSegmentLengthRule(255);
  const item = newSenderAudit("x", "y");
  item.segment = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SenderAuditRequiredSegmentRule flags a blank segment", () => {
  const rule = new SenderAuditRequiredSegmentRule("sender audit needs this field");
  const item = newSenderAudit("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
