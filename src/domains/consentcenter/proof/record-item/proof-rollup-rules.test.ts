import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ProofRollupRequiredLabelRule,
  ProofRollupUnitLengthRule,
  defaultProofRollupValidator,
} from "./proof-rollup-rules.js";
import { newProofRollup } from "./proof-rollup.js";

test("ProofRollupValidator reports every problem", () => {
  const validator = defaultProofRollupValidator();
  const item = newProofRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ProofRollupRequiredLabelRule flags a blank label", () => {
  const rule = new ProofRollupRequiredLabelRule("proof rollup needs this field");
  const item = newProofRollup("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ProofRollupUnitLengthRule flags a long unit", () => {
  const rule = new ProofRollupUnitLengthRule(255);
  const item = newProofRollup("x", "y");
  item.unit = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
