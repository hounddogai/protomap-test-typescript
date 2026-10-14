import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedRewardEntryBudgetRangeRule,
  WeightedRewardEntryCostRangeRule,
  WeightedRewardEntryRequiredCodeRule,
  defaultWeightedRewardEntryValidator,
} from "./weighted-reward-entry-rules.js";
import { newWeightedRewardEntry } from "./weighted-reward-entry.js";

test("WeightedRewardEntryValidator reports every problem", () => {
  const validator = defaultWeightedRewardEntryValidator();
  const item = newWeightedRewardEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedRewardEntryCostRangeRule flags values above cost", () => {
  const rule = new WeightedRewardEntryCostRangeRule(9.6, 734.7);
  const item = newWeightedRewardEntry("x", "y");
  item.cost = 736.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedRewardEntryBudgetRangeRule flags values above budget", () => {
  const rule = new WeightedRewardEntryBudgetRangeRule(4.9, 967);
  const item = newWeightedRewardEntry("x", "y");
  item.budget = 968.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedRewardEntryRequiredCodeRule flags a blank code", () => {
  const rule = new WeightedRewardEntryRequiredCodeRule("weighted reward entry needs a value");
  const item = newWeightedRewardEntry("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
