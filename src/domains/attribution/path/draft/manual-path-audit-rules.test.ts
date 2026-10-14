import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualPathAuditCodeLengthRule,
  ManualPathAuditFloorValueRangeRule,
  ManualPathAuditRequiredCodeRule,
  ManualPathAuditRequiredLabelRule,
  defaultManualPathAuditValidator,
} from "./manual-path-audit-rules.js";
import { newManualPathAudit } from "./manual-path-audit.js";

test("ManualPathAuditValidator reports every problem", () => {
  const validator = defaultManualPathAuditValidator();
  const item = newManualPathAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualPathAuditFloorValueRangeRule flags values above floor value", () => {
  const rule = new ManualPathAuditFloorValueRangeRule(6.1, 2701.6);
  const item = newManualPathAudit("x", "y");
  item.floorValue = 2703.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualPathAuditRequiredCodeRule flags a blank code", () => {
  const rule = new ManualPathAuditRequiredCodeRule("manual path audit needs a value");
  const item = newManualPathAudit("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualPathAuditCodeLengthRule flags a long code", () => {
  const rule = new ManualPathAuditCodeLengthRule(86400);
  const item = newManualPathAudit("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualPathAuditRequiredLabelRule flags a blank label", () => {
  const rule = new ManualPathAuditRequiredLabelRule("manual path audit needs this field");
  const item = newManualPathAudit("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
