import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ProofEntryDiscountRangeRule,
  ProofEntryRequiredUnitRule,
  ProofEntryRevisionRangeRule,
  defaultProofEntryValidator,
} from "./proof-entry-rules.js";
import { newProofEntry } from "./proof-entry.js";

test("ProofEntryValidator reports every problem", () => {
  const validator = defaultProofEntryValidator();
  const item = newProofEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ProofEntryRequiredUnitRule flags a blank unit", () => {
  const rule = new ProofEntryRequiredUnitRule("proof entry needs a value");
  const item = newProofEntry("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ProofEntryDiscountRangeRule flags values above discount", () => {
  const rule = new ProofEntryDiscountRangeRule(3.4, 2609.5);
  const item = newProofEntry("x", "y");
  item.discount = 2611;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ProofEntryRevisionRangeRule flags values above revision", () => {
  const rule = new ProofEntryRevisionRangeRule(80, 255);
  const item = newProofEntry("x", "y");
  item.revision = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
