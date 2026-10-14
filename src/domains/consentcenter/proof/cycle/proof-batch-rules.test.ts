import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ProofBatchRequiredCodeRule,
  ProofBatchRequiredLabelRule,
  ProofBatchTitleLengthRule,
  defaultProofBatchValidator,
} from "./proof-batch-rules.js";
import { newProofBatch } from "./proof-batch.js";

test("ProofBatchValidator reports every problem", () => {
  const validator = defaultProofBatchValidator();
  const item = newProofBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ProofBatchTitleLengthRule flags a long title", () => {
  const rule = new ProofBatchTitleLengthRule(1000);
  const item = newProofBatch("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ProofBatchRequiredLabelRule flags a blank label", () => {
  const rule = new ProofBatchRequiredLabelRule("proof batch needs this field");
  const item = newProofBatch("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ProofBatchRequiredCodeRule flags a blank code", () => {
  const rule = new ProofBatchRequiredCodeRule("proof batch needs an entry");
  const item = newProofBatch("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
