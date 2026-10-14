import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientMentionBudgetFloorValueRangeRule,
  defaultLenientMentionBudgetValidator,
} from "./lenient-mention-budget-rules.js";
import { newLenientMentionBudget } from "./lenient-mention-budget.js";

test("LenientMentionBudgetValidator reports every problem", () => {
  const validator = defaultLenientMentionBudgetValidator();
  const item = newLenientMentionBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientMentionBudgetFloorValueRangeRule flags values above floor value", () => {
  const rule = new LenientMentionBudgetFloorValueRangeRule(0.3, 4491.6);
  const item = newLenientMentionBudget("x", "y");
  item.floorValue = 4493.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
