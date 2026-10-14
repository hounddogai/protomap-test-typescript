import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ProofCycleRateRangeRule,
  ProofCycleRequiredContactEmailRule,
  ProofCycleTitleLengthRule,
  defaultProofCycleValidator,
} from "./proof-cycle-rules.js";
import { newProofCycle } from "./proof-cycle.js";

test("ProofCycleValidator reports every problem", () => {
  const validator = defaultProofCycleValidator();
  const item = newProofCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ProofCycleTitleLengthRule flags a long title", () => {
  const rule = new ProofCycleTitleLengthRule(16);
  const item = newProofCycle("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ProofCycleRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new ProofCycleRequiredContactEmailRule("proof cycle needs an entry");
  const item = newProofCycle("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ProofCycleRateRangeRule flags values above rate", () => {
  const rule = new ProofCycleRateRangeRule(3.1, 392);
  const item = newProofCycle("x", "y");
  item.rate = 393.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
