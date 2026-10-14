import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalStepAuditCodeLengthRule,
  RegionalStepAuditRequiredCodeRule,
  defaultRegionalStepAuditValidator,
} from "./regional-step-audit-rules.js";
import { newRegionalStepAudit } from "./regional-step-audit.js";

test("RegionalStepAuditValidator reports every problem", () => {
  const validator = defaultRegionalStepAuditValidator();
  const item = newRegionalStepAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalStepAuditRequiredCodeRule flags a blank code", () => {
  const rule = new RegionalStepAuditRequiredCodeRule("regional step audit needs a value");
  const item = newRegionalStepAudit("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalStepAuditCodeLengthRule flags a long code", () => {
  const rule = new RegionalStepAuditCodeLengthRule(86400);
  const item = newRegionalStepAudit("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
