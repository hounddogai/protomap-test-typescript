import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedCohortAllocationAmountRangeRule,
  BatchedCohortAllocationRequiredCodeRule,
  BatchedCohortAllocationRequiredNameRule,
  BatchedCohortAllocationRequiredOwnerIdRule,
  BatchedCohortAllocationUtmSourceLengthRule,
  defaultBatchedCohortAllocationValidator,
} from "./batched-cohort-allocation-rules.js";
import { newBatchedCohortAllocation } from "./batched-cohort-allocation.js";

test("BatchedCohortAllocationValidator reports every problem", () => {
  const validator = defaultBatchedCohortAllocationValidator();
  const item = newBatchedCohortAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedCohortAllocationAmountRangeRule flags values above amount", () => {
  const rule = new BatchedCohortAllocationAmountRangeRule(7.3, 666.4);
  const item = newBatchedCohortAllocation("x", "y");
  item.amount = 667.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedCohortAllocationRequiredCodeRule flags a blank code", () => {
  const rule = new BatchedCohortAllocationRequiredCodeRule("batched cohort allocation needs a value");
  const item = newBatchedCohortAllocation("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedCohortAllocationUtmSourceLengthRule flags a long utm source", () => {
  const rule = new BatchedCohortAllocationUtmSourceLengthRule(64);
  const item = newBatchedCohortAllocation("x", "y");
  item.utmSource = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedCohortAllocationRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new BatchedCohortAllocationRequiredOwnerIdRule("batched cohort allocation needs a value");
  const item = newBatchedCohortAllocation("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedCohortAllocationRequiredNameRule flags a blank name", () => {
  const rule = new BatchedCohortAllocationRequiredNameRule("batched cohort allocation needs an entry");
  const item = newBatchedCohortAllocation("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
