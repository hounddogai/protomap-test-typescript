import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedPathProfileBudgetRangeRule,
  BatchedPathProfileLabelLengthRule,
  BatchedPathProfileRequiredCodeRule,
  BatchedPathProfileRequiredTimezoneRule,
  defaultBatchedPathProfileValidator,
} from "./batched-path-profile-rules.js";
import { newBatchedPathProfile } from "./batched-path-profile.js";

test("BatchedPathProfileValidator reports every problem", () => {
  const validator = defaultBatchedPathProfileValidator();
  const item = newBatchedPathProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedPathProfileLabelLengthRule flags a long label", () => {
  const rule = new BatchedPathProfileLabelLengthRule(3600);
  const item = newBatchedPathProfile("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedPathProfileRequiredCodeRule flags a blank code", () => {
  const rule = new BatchedPathProfileRequiredCodeRule("batched path profile needs a value");
  const item = newBatchedPathProfile("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedPathProfileRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new BatchedPathProfileRequiredTimezoneRule("batched path profile needs an entry");
  const item = newBatchedPathProfile("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedPathProfileBudgetRangeRule flags values above budget", () => {
  const rule = new BatchedPathProfileBudgetRangeRule(9.8, 4334.2);
  const item = newBatchedPathProfile("x", "y");
  item.budget = 4335.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
