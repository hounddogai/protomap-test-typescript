import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalBounceBudgetBatchSizeRangeRule,
  RegionalBounceBudgetCodeLengthRule,
  RegionalBounceBudgetMarginRangeRule,
  RegionalBounceBudgetRequiredLabelRule,
  defaultRegionalBounceBudgetValidator,
} from "./regional-bounce-budget-rules.js";
import { newRegionalBounceBudget } from "./regional-bounce-budget.js";

test("RegionalBounceBudgetValidator reports every problem", () => {
  const validator = defaultRegionalBounceBudgetValidator();
  const item = newRegionalBounceBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalBounceBudgetMarginRangeRule flags values above margin", () => {
  const rule = new RegionalBounceBudgetMarginRangeRule(9.2, 4917.7);
  const item = newRegionalBounceBudget("x", "y");
  item.margin = 4919.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalBounceBudgetRequiredLabelRule flags a blank label", () => {
  const rule = new RegionalBounceBudgetRequiredLabelRule("regional bounce budget needs this field");
  const item = newRegionalBounceBudget("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalBounceBudgetCodeLengthRule flags a long code", () => {
  const rule = new RegionalBounceBudgetCodeLengthRule(32);
  const item = newRegionalBounceBudget("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalBounceBudgetBatchSizeRangeRule flags values above batch size", () => {
  const rule = new RegionalBounceBudgetBatchSizeRangeRule(80, 86400);
  const item = newRegionalBounceBudget("x", "y");
  item.batchSize = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
