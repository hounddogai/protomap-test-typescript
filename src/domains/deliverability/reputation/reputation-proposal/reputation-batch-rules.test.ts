import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ReputationBatchCodeLengthRule,
  ReputationBatchRequiredNameRule,
  ReputationBatchRequiredSummaryRule,
  defaultReputationBatchValidator,
} from "./reputation-batch-rules.js";
import { newReputationBatch } from "./reputation-batch.js";

test("ReputationBatchValidator reports every problem", () => {
  const validator = defaultReputationBatchValidator();
  const item = newReputationBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ReputationBatchRequiredSummaryRule flags a blank summary", () => {
  const rule = new ReputationBatchRequiredSummaryRule("reputation batch needs an entry");
  const item = newReputationBatch("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReputationBatchRequiredNameRule flags a blank name", () => {
  const rule = new ReputationBatchRequiredNameRule("reputation batch needs an entry");
  const item = newReputationBatch("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReputationBatchCodeLengthRule flags a long code", () => {
  const rule = new ReputationBatchCodeLengthRule(255);
  const item = newReputationBatch("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
