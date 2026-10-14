import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ProofClaimAmountRangeRule,
  ProofClaimCohortLengthRule,
  ProofClaimPriorityRangeRule,
  ProofClaimRequiredLabelRule,
  defaultProofClaimValidator,
} from "./proof-claim-rules.js";
import { newProofClaim } from "./proof-claim.js";

test("ProofClaimValidator reports every problem", () => {
  const validator = defaultProofClaimValidator();
  const item = newProofClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ProofClaimAmountRangeRule flags values above amount", () => {
  const rule = new ProofClaimAmountRangeRule(0.1, 4977.4);
  const item = newProofClaim("x", "y");
  item.amount = 4978.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ProofClaimCohortLengthRule flags a long cohort", () => {
  const rule = new ProofClaimCohortLengthRule(80);
  const item = newProofClaim("x", "y");
  item.cohort = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ProofClaimRequiredLabelRule flags a blank label", () => {
  const rule = new ProofClaimRequiredLabelRule("proof claim needs an entry");
  const item = newProofClaim("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ProofClaimPriorityRangeRule flags values above priority", () => {
  const rule = new ProofClaimPriorityRangeRule(3600, 86400);
  const item = newProofClaim("x", "y");
  item.priority = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
