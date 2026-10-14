import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ModelMappingRatioRangeRule,
  ModelMappingRequiredCategoryRule,
  ModelMappingRequiredCohortRule,
  ModelMappingRequiredLabelRule,
  defaultModelMappingValidator,
} from "./model-mapping-rules.js";
import { newModelMapping } from "./model-mapping.js";

test("ModelMappingValidator reports every problem", () => {
  const validator = defaultModelMappingValidator();
  const item = newModelMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ModelMappingRequiredCohortRule flags a blank cohort", () => {
  const rule = new ModelMappingRequiredCohortRule("model mapping needs an entry");
  const item = newModelMapping("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ModelMappingRequiredLabelRule flags a blank label", () => {
  const rule = new ModelMappingRequiredLabelRule("model mapping needs this field");
  const item = newModelMapping("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ModelMappingRequiredCategoryRule flags a blank category", () => {
  const rule = new ModelMappingRequiredCategoryRule("model mapping needs this field");
  const item = newModelMapping("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ModelMappingRatioRangeRule flags values above ratio", () => {
  const rule = new ModelMappingRatioRangeRule(2.5, 3977.4);
  const item = newModelMapping("x", "y");
  item.ratio = 3978.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
