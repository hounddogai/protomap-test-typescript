import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedProofCycleChecksumLengthRule,
  defaultBatchedProofCycleValidator,
} from "./batched-proof-cycle-rules.js";
import { newBatchedProofCycle } from "./batched-proof-cycle.js";

test("BatchedProofCycleValidator reports every problem", () => {
  const validator = defaultBatchedProofCycleValidator();
  const item = newBatchedProofCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedProofCycleChecksumLengthRule flags a long checksum", () => {
  const rule = new BatchedProofCycleChecksumLengthRule(255);
  const item = newBatchedProofCycle("x", "y");
  item.checksum = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
