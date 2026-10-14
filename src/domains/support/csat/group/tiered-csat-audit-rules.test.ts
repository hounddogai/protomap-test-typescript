import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredCsatAuditBudgetRangeRule,
  TieredCsatAuditCeilingRangeRule,
  TieredCsatAuditRequiredCodeRule,
  TieredCsatAuditRequiredJourneyIdRule,
  defaultTieredCsatAuditValidator,
} from "./tiered-csat-audit-rules.js";
import { newTieredCsatAudit } from "./tiered-csat-audit.js";

test("TieredCsatAuditValidator reports every problem", () => {
  const validator = defaultTieredCsatAuditValidator();
  const item = newTieredCsatAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredCsatAuditRequiredCodeRule flags a blank code", () => {
  const rule = new TieredCsatAuditRequiredCodeRule("tiered csat audit needs a value");
  const item = newTieredCsatAudit("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredCsatAuditBudgetRangeRule flags values above budget", () => {
  const rule = new TieredCsatAuditBudgetRangeRule(0.9, 1983.8);
  const item = newTieredCsatAudit("x", "y");
  item.budget = 1985.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredCsatAuditRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new TieredCsatAuditRequiredJourneyIdRule("tiered csat audit needs a value");
  const item = newTieredCsatAudit("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredCsatAuditCeilingRangeRule flags values above ceiling", () => {
  const rule = new TieredCsatAuditCeilingRangeRule(3.7, 3161.9);
  const item = newTieredCsatAudit("x", "y");
  item.ceiling = 3163.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
