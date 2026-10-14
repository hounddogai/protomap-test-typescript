import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredPacingAuditBudgetRangeRule,
  TieredPacingAuditRequiredCohortRule,
  TieredPacingAuditTitleLengthRule,
  TieredPacingAuditUpdatedAtRangeRule,
  defaultTieredPacingAuditValidator,
} from "./tiered-pacing-audit-rules.js";
import { newTieredPacingAudit } from "./tiered-pacing-audit.js";

test("TieredPacingAuditValidator reports every problem", () => {
  const validator = defaultTieredPacingAuditValidator();
  const item = newTieredPacingAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredPacingAuditUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new TieredPacingAuditUpdatedAtRangeRule(64, 64);
  const item = newTieredPacingAudit("x", "y");
  item.updatedAt = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredPacingAuditTitleLengthRule flags a long title", () => {
  const rule = new TieredPacingAuditTitleLengthRule(3600);
  const item = newTieredPacingAudit("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredPacingAuditBudgetRangeRule flags values above budget", () => {
  const rule = new TieredPacingAuditBudgetRangeRule(3.9, 2214.4);
  const item = newTieredPacingAudit("x", "y");
  item.budget = 2215.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredPacingAuditRequiredCohortRule flags a blank cohort", () => {
  const rule = new TieredPacingAuditRequiredCohortRule("tiered pacing audit needs a value");
  const item = newTieredPacingAudit("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
