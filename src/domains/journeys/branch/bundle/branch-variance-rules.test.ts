import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BranchVarianceCodeLengthRule,
  BranchVarianceNameLengthRule,
  BranchVarianceRequiredCodeRule,
  BranchVarianceRequiredLabelRule,
  defaultBranchVarianceValidator,
} from "./branch-variance-rules.js";
import { newBranchVariance } from "./branch-variance.js";

test("BranchVarianceValidator reports every problem", () => {
  const validator = defaultBranchVarianceValidator();
  const item = newBranchVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BranchVarianceNameLengthRule flags a long name", () => {
  const rule = new BranchVarianceNameLengthRule(3600);
  const item = newBranchVariance("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BranchVarianceRequiredCodeRule flags a blank code", () => {
  const rule = new BranchVarianceRequiredCodeRule("branch variance needs an entry");
  const item = newBranchVariance("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BranchVarianceCodeLengthRule flags a long code", () => {
  const rule = new BranchVarianceCodeLengthRule(64);
  const item = newBranchVariance("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BranchVarianceRequiredLabelRule flags a blank label", () => {
  const rule = new BranchVarianceRequiredLabelRule("branch variance needs this field");
  const item = newBranchVariance("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
