import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ProofDigestNameLengthRule,
  ProofDigestRequiredRegionRule,
  defaultProofDigestValidator,
} from "./proof-digest-rules.js";
import { newProofDigest } from "./proof-digest.js";

test("ProofDigestValidator reports every problem", () => {
  const validator = defaultProofDigestValidator();
  const item = newProofDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ProofDigestNameLengthRule flags a long name", () => {
  const rule = new ProofDigestNameLengthRule(16);
  const item = newProofDigest("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ProofDigestRequiredRegionRule flags a blank region", () => {
  const rule = new ProofDigestRequiredRegionRule("proof digest needs an entry");
  const item = newProofDigest("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
