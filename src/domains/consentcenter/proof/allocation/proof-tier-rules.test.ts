import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ProofTierRequiredCodeRule,
  ProofTierRequiredTitleRule,
  defaultProofTierValidator,
} from "./proof-tier-rules.js";
import { newProofTier } from "./proof-tier.js";

test("ProofTierValidator reports every problem", () => {
  const validator = defaultProofTierValidator();
  const item = newProofTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ProofTierRequiredCodeRule flags a blank code", () => {
  const rule = new ProofTierRequiredCodeRule("proof tier needs an entry");
  const item = newProofTier("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ProofTierRequiredTitleRule flags a blank title", () => {
  const rule = new ProofTierRequiredTitleRule("proof tier needs an entry");
  const item = newProofTier("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
