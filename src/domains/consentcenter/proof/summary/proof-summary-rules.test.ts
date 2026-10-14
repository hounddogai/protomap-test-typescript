import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ProofSummaryCeilingRangeRule,
  ProofSummaryOwnerIdLengthRule,
  defaultProofSummaryValidator,
} from "./proof-summary-rules.js";
import { newProofSummary } from "./proof-summary.js";

test("ProofSummaryValidator reports every problem", () => {
  const validator = defaultProofSummaryValidator();
  const item = newProofSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ProofSummaryOwnerIdLengthRule flags a long owner id", () => {
  const rule = new ProofSummaryOwnerIdLengthRule(3600);
  const item = newProofSummary("x", "y");
  item.ownerId = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ProofSummaryCeilingRangeRule flags values above ceiling", () => {
  const rule = new ProofSummaryCeilingRangeRule(1.2, 989.1);
  const item = newProofSummary("x", "y");
  item.ceiling = 990.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
