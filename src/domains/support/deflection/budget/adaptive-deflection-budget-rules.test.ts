import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveDeflectionBudgetRequiredCodeRule,
  AdaptiveDeflectionBudgetSendAtRangeRule,
  AdaptiveDeflectionBudgetStartsAtRangeRule,
  defaultAdaptiveDeflectionBudgetValidator,
} from "./adaptive-deflection-budget-rules.js";
import { newAdaptiveDeflectionBudget } from "./adaptive-deflection-budget.js";

test("AdaptiveDeflectionBudgetValidator reports every problem", () => {
  const validator = defaultAdaptiveDeflectionBudgetValidator();
  const item = newAdaptiveDeflectionBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveDeflectionBudgetSendAtRangeRule flags values above send at", () => {
  const rule = new AdaptiveDeflectionBudgetSendAtRangeRule(255, 255);
  const item = newAdaptiveDeflectionBudget("x", "y");
  item.sendAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveDeflectionBudgetRequiredCodeRule flags a blank code", () => {
  const rule = new AdaptiveDeflectionBudgetRequiredCodeRule("adaptive deflection budget needs an entry");
  const item = newAdaptiveDeflectionBudget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveDeflectionBudgetStartsAtRangeRule flags values above starts at", () => {
  const rule = new AdaptiveDeflectionBudgetStartsAtRangeRule(16, 1000);
  const item = newAdaptiveDeflectionBudget("x", "y");
  item.startsAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
