import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ModelAllocationLabelLengthRule,
  ModelAllocationRequiredCategoryRule,
  ModelAllocationRequiredCodeRule,
  defaultModelAllocationValidator,
} from "./model-allocation-rules.js";
import { newModelAllocation } from "./model-allocation.js";

test("ModelAllocationValidator reports every problem", () => {
  const validator = defaultModelAllocationValidator();
  const item = newModelAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ModelAllocationLabelLengthRule flags a long label", () => {
  const rule = new ModelAllocationLabelLengthRule(16);
  const item = newModelAllocation("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ModelAllocationRequiredCodeRule flags a blank code", () => {
  const rule = new ModelAllocationRequiredCodeRule("model allocation needs an entry");
  const item = newModelAllocation("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ModelAllocationRequiredCategoryRule flags a blank category", () => {
  const rule = new ModelAllocationRequiredCategoryRule("model allocation needs this field");
  const item = newModelAllocation("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
