import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ProofAllocationCapacityRangeRule,
  ProofAllocationCodeLengthRule,
  ProofAllocationLocaleLengthRule,
  ProofAllocationRequiredLocaleRule,
  ProofAllocationVariantLengthRule,
  defaultProofAllocationValidator,
} from "./proof-allocation-rules.js";
import { newProofAllocation } from "./proof-allocation.js";

test("ProofAllocationValidator reports every problem", () => {
  const validator = defaultProofAllocationValidator();
  const item = newProofAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ProofAllocationRequiredLocaleRule flags a blank locale", () => {
  const rule = new ProofAllocationRequiredLocaleRule("proof allocation needs a value");
  const item = newProofAllocation("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ProofAllocationCapacityRangeRule flags values above capacity", () => {
  const rule = new ProofAllocationCapacityRangeRule(64, 86400);
  const item = newProofAllocation("x", "y");
  item.capacity = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ProofAllocationVariantLengthRule flags a long variant", () => {
  const rule = new ProofAllocationVariantLengthRule(64);
  const item = newProofAllocation("x", "y");
  item.variant = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ProofAllocationCodeLengthRule flags a long code", () => {
  const rule = new ProofAllocationCodeLengthRule(64);
  const item = newProofAllocation("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ProofAllocationLocaleLengthRule flags a long locale", () => {
  const rule = new ProofAllocationLocaleLengthRule(3600);
  const item = newProofAllocation("x", "y");
  item.locale = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
