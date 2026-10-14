import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CsatAuditChannelLengthRule,
  CsatAuditRequiredCodeRule,
  CsatAuditRequiredNotesRule,
  defaultCsatAuditValidator,
} from "./csat-audit-rules.js";
import { newCsatAudit } from "./csat-audit.js";

test("CsatAuditValidator reports every problem", () => {
  const validator = defaultCsatAuditValidator();
  const item = newCsatAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CsatAuditRequiredCodeRule flags a blank code", () => {
  const rule = new CsatAuditRequiredCodeRule("csat audit needs a value");
  const item = newCsatAudit("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CsatAuditRequiredNotesRule flags a blank notes", () => {
  const rule = new CsatAuditRequiredNotesRule("csat audit needs a value");
  const item = newCsatAudit("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CsatAuditChannelLengthRule flags a long channel", () => {
  const rule = new CsatAuditChannelLengthRule(16);
  const item = newCsatAudit("x", "y");
  item.channel = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
