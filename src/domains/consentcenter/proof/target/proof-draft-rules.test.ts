import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ProofDraftRateRangeRule,
  ProofDraftRequiredSourceRule,
  ProofDraftRequiredUnitRule,
  ProofDraftThresholdRangeRule,
  ProofDraftUnitLengthRule,
  defaultProofDraftValidator,
} from "./proof-draft-rules.js";
import { newProofDraft } from "./proof-draft.js";

test("ProofDraftValidator reports every problem", () => {
  const validator = defaultProofDraftValidator();
  const item = newProofDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ProofDraftRateRangeRule flags values above rate", () => {
  const rule = new ProofDraftRateRangeRule(1.3, 3362.3);
  const item = newProofDraft("x", "y");
  item.rate = 3363.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ProofDraftUnitLengthRule flags a long unit", () => {
  const rule = new ProofDraftUnitLengthRule(86400);
  const item = newProofDraft("x", "y");
  item.unit = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ProofDraftRequiredUnitRule flags a blank unit", () => {
  const rule = new ProofDraftRequiredUnitRule("proof draft needs an entry");
  const item = newProofDraft("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ProofDraftThresholdRangeRule flags values above threshold", () => {
  const rule = new ProofDraftThresholdRangeRule(0.1, 179.7);
  const item = newProofDraft("x", "y");
  item.threshold = 181.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ProofDraftRequiredSourceRule flags a blank source", () => {
  const rule = new ProofDraftRequiredSourceRule("proof draft needs this field");
  const item = newProofDraft("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
