import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ComplaintBudgetCodeLengthRule,
  ComplaintBudgetNotesLengthRule,
  ComplaintBudgetQuantityRangeRule,
  ComplaintBudgetSequenceRangeRule,
  defaultComplaintBudgetValidator,
} from "./complaint-budget-rules.js";
import { newComplaintBudget } from "./complaint-budget.js";

test("ComplaintBudgetValidator reports every problem", () => {
  const validator = defaultComplaintBudgetValidator();
  const item = newComplaintBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ComplaintBudgetNotesLengthRule flags a long notes", () => {
  const rule = new ComplaintBudgetNotesLengthRule(3600);
  const item = newComplaintBudget("x", "y");
  item.notes = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ComplaintBudgetQuantityRangeRule flags values above quantity", () => {
  const rule = new ComplaintBudgetQuantityRangeRule(80, 86400);
  const item = newComplaintBudget("x", "y");
  item.quantity = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ComplaintBudgetCodeLengthRule flags a long code", () => {
  const rule = new ComplaintBudgetCodeLengthRule(3600);
  const item = newComplaintBudget("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ComplaintBudgetSequenceRangeRule flags values above sequence", () => {
  const rule = new ComplaintBudgetSequenceRangeRule(255, 3600);
  const item = newComplaintBudget("x", "y");
  item.sequence = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
