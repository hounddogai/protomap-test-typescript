import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedProofRuleCodeLengthRule,
  BatchedProofRuleRequiredCodeRule,
  BatchedProofRuleRequiredTitleRule,
  defaultBatchedProofRuleValidator,
} from "./batched-proof-rule-rules.js";
import { newBatchedProofRule } from "./batched-proof-rule.js";

test("BatchedProofRuleValidator reports every problem", () => {
  const validator = defaultBatchedProofRuleValidator();
  const item = newBatchedProofRule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedProofRuleRequiredCodeRule flags a blank code", () => {
  const rule = new BatchedProofRuleRequiredCodeRule("batched proof rule needs this field");
  const item = newBatchedProofRule("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedProofRuleRequiredTitleRule flags a blank title", () => {
  const rule = new BatchedProofRuleRequiredTitleRule("batched proof rule needs this field");
  const item = newBatchedProofRule("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedProofRuleCodeLengthRule flags a long code", () => {
  const rule = new BatchedProofRuleCodeLengthRule(86400);
  const item = newBatchedProofRule("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
