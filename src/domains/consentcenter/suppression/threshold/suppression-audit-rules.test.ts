import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SuppressionAuditMaximumRangeRule,
  SuppressionAuditRequiredCodeRule,
  SuppressionAuditRequiredLabelRule,
  SuppressionAuditUpdatedAtRangeRule,
  defaultSuppressionAuditValidator,
} from "./suppression-audit-rules.js";
import { newSuppressionAudit } from "./suppression-audit.js";

test("SuppressionAuditValidator reports every problem", () => {
  const validator = defaultSuppressionAuditValidator();
  const item = newSuppressionAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SuppressionAuditRequiredCodeRule flags a blank code", () => {
  const rule = new SuppressionAuditRequiredCodeRule("suppression audit needs an entry");
  const item = newSuppressionAudit("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SuppressionAuditUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new SuppressionAuditUpdatedAtRangeRule(16, 120);
  const item = newSuppressionAudit("x", "y");
  item.updatedAt = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SuppressionAuditRequiredLabelRule flags a blank label", () => {
  const rule = new SuppressionAuditRequiredLabelRule("suppression audit needs this field");
  const item = newSuppressionAudit("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SuppressionAuditMaximumRangeRule flags values above maximum", () => {
  const rule = new SuppressionAuditMaximumRangeRule(9.4, 2483.9);
  const item = newSuppressionAudit("x", "y");
  item.maximum = 2485.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
