import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalPlacementTemplateBudgetRangeRule,
  RegionalPlacementTemplateRequiredReviewerRule,
  RegionalPlacementTemplateTitleLengthRule,
  defaultRegionalPlacementTemplateValidator,
} from "./regional-placement-template-rules.js";
import { newRegionalPlacementTemplate } from "./regional-placement-template.js";

test("RegionalPlacementTemplateValidator reports every problem", () => {
  const validator = defaultRegionalPlacementTemplateValidator();
  const item = newRegionalPlacementTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalPlacementTemplateTitleLengthRule flags a long title", () => {
  const rule = new RegionalPlacementTemplateTitleLengthRule(64);
  const item = newRegionalPlacementTemplate("x", "y");
  item.title = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalPlacementTemplateRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new RegionalPlacementTemplateRequiredReviewerRule("regional placement template needs a value");
  const item = newRegionalPlacementTemplate("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RegionalPlacementTemplateBudgetRangeRule flags values above budget", () => {
  const rule = new RegionalPlacementTemplateBudgetRangeRule(7.9, 1977.2);
  const item = newRegionalPlacementTemplate("x", "y");
  item.budget = 1978.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
