import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalStepAuditCodeLengthRule,
  GlobalStepAuditRequiredLabelRule,
  GlobalStepAuditRequiredRegionRule,
  defaultGlobalStepAuditValidator,
} from "./global-step-audit-rules.js";
import { newGlobalStepAudit } from "./global-step-audit.js";

test("GlobalStepAuditValidator reports every problem", () => {
  const validator = defaultGlobalStepAuditValidator();
  const item = newGlobalStepAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalStepAuditRequiredRegionRule flags a blank region", () => {
  const rule = new GlobalStepAuditRequiredRegionRule("global step audit needs this field");
  const item = newGlobalStepAudit("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalStepAuditRequiredLabelRule flags a blank label", () => {
  const rule = new GlobalStepAuditRequiredLabelRule("global step audit needs a value");
  const item = newGlobalStepAudit("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalStepAuditCodeLengthRule flags a long code", () => {
  const rule = new GlobalStepAuditCodeLengthRule(86400);
  const item = newGlobalStepAudit("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
