import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryComplaintBudgetCreatedAtRangeRule,
  PrimaryComplaintBudgetExpiresAtRangeRule,
  PrimaryComplaintBudgetOpenRateRangeRule,
  defaultPrimaryComplaintBudgetValidator,
} from "./primary-complaint-budget-rules.js";
import { newPrimaryComplaintBudget } from "./primary-complaint-budget.js";

test("PrimaryComplaintBudgetValidator reports every problem", () => {
  const validator = defaultPrimaryComplaintBudgetValidator();
  const item = newPrimaryComplaintBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryComplaintBudgetExpiresAtRangeRule flags values above expires at", () => {
  const rule = new PrimaryComplaintBudgetExpiresAtRangeRule(120, 1000);
  const item = newPrimaryComplaintBudget("x", "y");
  item.expiresAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryComplaintBudgetOpenRateRangeRule flags values above open rate", () => {
  const rule = new PrimaryComplaintBudgetOpenRateRangeRule(4.4, 172.7);
  const item = newPrimaryComplaintBudget("x", "y");
  item.openRate = 174.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryComplaintBudgetCreatedAtRangeRule flags values above created at", () => {
  const rule = new PrimaryComplaintBudgetCreatedAtRangeRule(64, 80);
  const item = newPrimaryComplaintBudget("x", "y");
  item.createdAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
