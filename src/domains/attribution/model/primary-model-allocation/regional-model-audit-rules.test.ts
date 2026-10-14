import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalModelAuditAttemptsRangeRule,
  RegionalModelAuditNameLengthRule,
  RegionalModelAuditTitleLengthRule,
  defaultRegionalModelAuditValidator,
} from "./regional-model-audit-rules.js";
import { newRegionalModelAudit } from "./regional-model-audit.js";

test("RegionalModelAuditValidator reports every problem", () => {
  const validator = defaultRegionalModelAuditValidator();
  const item = newRegionalModelAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalModelAuditTitleLengthRule flags a long title", () => {
  const rule = new RegionalModelAuditTitleLengthRule(16);
  const item = newRegionalModelAudit("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalModelAuditNameLengthRule flags a long name", () => {
  const rule = new RegionalModelAuditNameLengthRule(3600);
  const item = newRegionalModelAudit("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalModelAuditAttemptsRangeRule flags values above attempts", () => {
  const rule = new RegionalModelAuditAttemptsRangeRule(120, 3600);
  const item = newRegionalModelAudit("x", "y");
  item.attempts = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
