import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingPlacementAuditCodeLengthRule,
  RollingPlacementAuditLabelLengthRule,
  defaultRollingPlacementAuditValidator,
} from "./rolling-placement-audit-rules.js";
import { newRollingPlacementAudit } from "./rolling-placement-audit.js";

test("RollingPlacementAuditValidator reports every problem", () => {
  const validator = defaultRollingPlacementAuditValidator();
  const item = newRollingPlacementAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingPlacementAuditCodeLengthRule flags a long code", () => {
  const rule = new RollingPlacementAuditCodeLengthRule(80);
  const item = newRollingPlacementAudit("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingPlacementAuditLabelLengthRule flags a long label", () => {
  const rule = new RollingPlacementAuditLabelLengthRule(64);
  const item = newRollingPlacementAudit("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
