import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedBranchAgreementCurrencyLengthRule,
  BatchedBranchAgreementRevisionRangeRule,
  defaultBatchedBranchAgreementValidator,
} from "./batched-branch-agreement-rules.js";
import { newBatchedBranchAgreement } from "./batched-branch-agreement.js";

test("BatchedBranchAgreementValidator reports every problem", () => {
  const validator = defaultBatchedBranchAgreementValidator();
  const item = newBatchedBranchAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedBranchAgreementRevisionRangeRule flags values above revision", () => {
  const rule = new BatchedBranchAgreementRevisionRangeRule(255, 1000);
  const item = newBatchedBranchAgreement("x", "y");
  item.revision = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedBranchAgreementCurrencyLengthRule flags a long currency", () => {
  const rule = new BatchedBranchAgreementCurrencyLengthRule(64);
  const item = newBatchedBranchAgreement("x", "y");
  item.currency = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
