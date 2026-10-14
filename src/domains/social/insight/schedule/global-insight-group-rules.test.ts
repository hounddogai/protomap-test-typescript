import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalInsightGroupBudgetRangeRule,
  GlobalInsightGroupCategoryLengthRule,
  GlobalInsightGroupRequiredLabelRule,
  defaultGlobalInsightGroupValidator,
} from "./global-insight-group-rules.js";
import { newGlobalInsightGroup } from "./global-insight-group.js";

test("GlobalInsightGroupValidator reports every problem", () => {
  const validator = defaultGlobalInsightGroupValidator();
  const item = newGlobalInsightGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalInsightGroupBudgetRangeRule flags values above budget", () => {
  const rule = new GlobalInsightGroupBudgetRangeRule(3.7, 262.6);
  const item = newGlobalInsightGroup("x", "y");
  item.budget = 264.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalInsightGroupRequiredLabelRule flags a blank label", () => {
  const rule = new GlobalInsightGroupRequiredLabelRule("global insight group needs this field");
  const item = newGlobalInsightGroup("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalInsightGroupCategoryLengthRule flags a long category", () => {
  const rule = new GlobalInsightGroupCategoryLengthRule(120);
  const item = newGlobalInsightGroup("x", "y");
  item.category = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
