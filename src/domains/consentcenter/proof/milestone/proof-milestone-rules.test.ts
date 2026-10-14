import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ProofMilestoneRequiredCountryRule,
  ProofMilestoneRequiredTimezoneRule,
  ProofMilestoneTimezoneLengthRule,
  defaultProofMilestoneValidator,
} from "./proof-milestone-rules.js";
import { newProofMilestone } from "./proof-milestone.js";

test("ProofMilestoneValidator reports every problem", () => {
  const validator = defaultProofMilestoneValidator();
  const item = newProofMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ProofMilestoneRequiredCountryRule flags a blank country", () => {
  const rule = new ProofMilestoneRequiredCountryRule("proof milestone needs this field");
  const item = newProofMilestone("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ProofMilestoneTimezoneLengthRule flags a long timezone", () => {
  const rule = new ProofMilestoneTimezoneLengthRule(255);
  const item = newProofMilestone("x", "y");
  item.timezone = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ProofMilestoneRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new ProofMilestoneRequiredTimezoneRule("proof milestone needs an entry");
  const item = newProofMilestone("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
