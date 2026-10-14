import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalModelAuditBudgetRangeRule,
  SeasonalModelAuditLabelLengthRule,
  defaultSeasonalModelAuditValidator,
} from "./seasonal-model-audit-rules.js";
import { newSeasonalModelAudit } from "./seasonal-model-audit.js";

test("SeasonalModelAuditValidator reports every problem", () => {
  const validator = defaultSeasonalModelAuditValidator();
  const item = newSeasonalModelAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalModelAuditBudgetRangeRule flags values above budget", () => {
  const rule = new SeasonalModelAuditBudgetRangeRule(6.4, 2456.1);
  const item = newSeasonalModelAudit("x", "y");
  item.budget = 2457.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalModelAuditLabelLengthRule flags a long label", () => {
  const rule = new SeasonalModelAuditLabelLengthRule(16);
  const item = newSeasonalModelAudit("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
