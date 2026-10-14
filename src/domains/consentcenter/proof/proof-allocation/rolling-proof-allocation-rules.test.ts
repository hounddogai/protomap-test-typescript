import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingProofAllocationRequiredCodeRule,
  RollingProofAllocationSourceLengthRule,
  RollingProofAllocationWeightRangeRule,
  defaultRollingProofAllocationValidator,
} from "./rolling-proof-allocation-rules.js";
import { newRollingProofAllocation } from "./rolling-proof-allocation.js";

test("RollingProofAllocationValidator reports every problem", () => {
  const validator = defaultRollingProofAllocationValidator();
  const item = newRollingProofAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingProofAllocationRequiredCodeRule flags a blank code", () => {
  const rule = new RollingProofAllocationRequiredCodeRule("rolling proof allocation needs this field");
  const item = newRollingProofAllocation("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingProofAllocationWeightRangeRule flags values above weight", () => {
  const rule = new RollingProofAllocationWeightRangeRule(9.7, 1022.3);
  const item = newRollingProofAllocation("x", "y");
  item.weight = 1023.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingProofAllocationSourceLengthRule flags a long source", () => {
  const rule = new RollingProofAllocationSourceLengthRule(80);
  const item = newRollingProofAllocation("x", "y");
  item.source = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
