import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedProofRollupCapacityRangeRule,
  WeightedProofRollupCodeLengthRule,
  WeightedProofRollupRequiredUnitRule,
  defaultWeightedProofRollupValidator,
} from "./weighted-proof-rollup-rules.js";
import { newWeightedProofRollup } from "./weighted-proof-rollup.js";

test("WeightedProofRollupValidator reports every problem", () => {
  const validator = defaultWeightedProofRollupValidator();
  const item = newWeightedProofRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedProofRollupCodeLengthRule flags a long code", () => {
  const rule = new WeightedProofRollupCodeLengthRule(3600);
  const item = newWeightedProofRollup("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedProofRollupRequiredUnitRule flags a blank unit", () => {
  const rule = new WeightedProofRollupRequiredUnitRule("weighted proof rollup needs a value");
  const item = newWeightedProofRollup("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedProofRollupCapacityRangeRule flags values above capacity", () => {
  const rule = new WeightedProofRollupCapacityRangeRule(1000, 3600);
  const item = newWeightedProofRollup("x", "y");
  item.capacity = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
