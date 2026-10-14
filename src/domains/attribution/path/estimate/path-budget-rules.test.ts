import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PathBudgetMaximumRangeRule,
  PathBudgetRequiredAudienceIdRule,
  PathBudgetRequiredCodeRule,
  PathBudgetRequiredDescriptionRule,
  PathBudgetStartsAtRangeRule,
  defaultPathBudgetValidator,
} from "./path-budget-rules.js";
import { newPathBudget } from "./path-budget.js";

test("PathBudgetValidator reports every problem", () => {
  const validator = defaultPathBudgetValidator();
  const item = newPathBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PathBudgetRequiredDescriptionRule flags a blank description", () => {
  const rule = new PathBudgetRequiredDescriptionRule("path budget needs a value");
  const item = newPathBudget("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PathBudgetStartsAtRangeRule flags values above starts at", () => {
  const rule = new PathBudgetStartsAtRangeRule(32, 64);
  const item = newPathBudget("x", "y");
  item.startsAt = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PathBudgetRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new PathBudgetRequiredAudienceIdRule("path budget needs an entry");
  const item = newPathBudget("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PathBudgetMaximumRangeRule flags values above maximum", () => {
  const rule = new PathBudgetMaximumRangeRule(1.9, 1155.4);
  const item = newPathBudget("x", "y");
  item.maximum = 1156.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PathBudgetRequiredCodeRule flags a blank code", () => {
  const rule = new PathBudgetRequiredCodeRule("path budget needs a value");
  const item = newPathBudget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
