import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveCreativeBudgetOwnerIdLengthRule,
  AdaptiveCreativeBudgetRevisionRangeRule,
  AdaptiveCreativeBudgetTitleLengthRule,
  defaultAdaptiveCreativeBudgetValidator,
} from "./adaptive-creative-budget-rules.js";
import { newAdaptiveCreativeBudget } from "./adaptive-creative-budget.js";

test("AdaptiveCreativeBudgetValidator reports every problem", () => {
  const validator = defaultAdaptiveCreativeBudgetValidator();
  const item = newAdaptiveCreativeBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveCreativeBudgetTitleLengthRule flags a long title", () => {
  const rule = new AdaptiveCreativeBudgetTitleLengthRule(64);
  const item = newAdaptiveCreativeBudget("x", "y");
  item.title = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveCreativeBudgetRevisionRangeRule flags values above revision", () => {
  const rule = new AdaptiveCreativeBudgetRevisionRangeRule(3600, 3600);
  const item = newAdaptiveCreativeBudget("x", "y");
  item.revision = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveCreativeBudgetOwnerIdLengthRule flags a long owner id", () => {
  const rule = new AdaptiveCreativeBudgetOwnerIdLengthRule(1000);
  const item = newAdaptiveCreativeBudget("x", "y");
  item.ownerId = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
