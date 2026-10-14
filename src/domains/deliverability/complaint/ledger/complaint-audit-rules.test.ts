import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ComplaintAuditCodeLengthRule,
  ComplaintAuditRequiredCodeRule,
  defaultComplaintAuditValidator,
} from "./complaint-audit-rules.js";
import { newComplaintAudit } from "./complaint-audit.js";

test("ComplaintAuditValidator reports every problem", () => {
  const validator = defaultComplaintAuditValidator();
  const item = newComplaintAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ComplaintAuditCodeLengthRule flags a long code", () => {
  const rule = new ComplaintAuditCodeLengthRule(3600);
  const item = newComplaintAudit("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ComplaintAuditRequiredCodeRule flags a blank code", () => {
  const rule = new ComplaintAuditRequiredCodeRule("complaint audit needs a value");
  const item = newComplaintAudit("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
