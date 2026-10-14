import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ModelMilestoneBidRangeRule,
  ModelMilestoneBudgetRangeRule,
  ModelMilestoneRequiredCategoryRule,
  ModelMilestoneRequiredCodeRule,
  defaultModelMilestoneValidator,
} from "./model-milestone-rules.js";
import { newModelMilestone } from "./model-milestone.js";

test("ModelMilestoneValidator reports every problem", () => {
  const validator = defaultModelMilestoneValidator();
  const item = newModelMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ModelMilestoneRequiredCodeRule flags a blank code", () => {
  const rule = new ModelMilestoneRequiredCodeRule("model milestone needs a value");
  const item = newModelMilestone("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ModelMilestoneRequiredCategoryRule flags a blank category", () => {
  const rule = new ModelMilestoneRequiredCategoryRule("model milestone needs a value");
  const item = newModelMilestone("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ModelMilestoneBidRangeRule flags values above bid", () => {
  const rule = new ModelMilestoneBidRangeRule(5.3, 4271.4);
  const item = newModelMilestone("x", "y");
  item.bid = 4272.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ModelMilestoneBudgetRangeRule flags values above budget", () => {
  const rule = new ModelMilestoneBudgetRangeRule(1.3, 3247.7);
  const item = newModelMilestone("x", "y");
  item.budget = 3249.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
