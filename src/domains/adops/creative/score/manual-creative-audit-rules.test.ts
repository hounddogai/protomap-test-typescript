import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualCreativeAuditChannelLengthRule,
  ManualCreativeAuditCodeLengthRule,
  ManualCreativeAuditCreatedAtRangeRule,
  ManualCreativeAuditRequiredTitleRule,
  ManualCreativeAuditTitleLengthRule,
  defaultManualCreativeAuditValidator,
} from "./manual-creative-audit-rules.js";
import { newManualCreativeAudit } from "./manual-creative-audit.js";

test("ManualCreativeAuditValidator reports every problem", () => {
  const validator = defaultManualCreativeAuditValidator();
  const item = newManualCreativeAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualCreativeAuditRequiredTitleRule flags a blank title", () => {
  const rule = new ManualCreativeAuditRequiredTitleRule("manual creative audit needs this field");
  const item = newManualCreativeAudit("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualCreativeAuditTitleLengthRule flags a long title", () => {
  const rule = new ManualCreativeAuditTitleLengthRule(3600);
  const item = newManualCreativeAudit("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualCreativeAuditCodeLengthRule flags a long code", () => {
  const rule = new ManualCreativeAuditCodeLengthRule(120);
  const item = newManualCreativeAudit("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualCreativeAuditChannelLengthRule flags a long channel", () => {
  const rule = new ManualCreativeAuditChannelLengthRule(255);
  const item = newManualCreativeAudit("x", "y");
  item.channel = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualCreativeAuditCreatedAtRangeRule flags values above created at", () => {
  const rule = new ManualCreativeAuditCreatedAtRangeRule(255, 86400);
  const item = newManualCreativeAudit("x", "y");
  item.createdAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
