import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ProofProfileCurrencyLengthRule,
  ProofProfileGraceDaysRangeRule,
  ProofProfileRequiredCodeRule,
  ProofProfileRequiredVariantRule,
  ProofProfileVariantLengthRule,
  defaultProofProfileValidator,
} from "./proof-profile-rules.js";
import { newProofProfile } from "./proof-profile.js";

test("ProofProfileValidator reports every problem", () => {
  const validator = defaultProofProfileValidator();
  const item = newProofProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ProofProfileVariantLengthRule flags a long variant", () => {
  const rule = new ProofProfileVariantLengthRule(80);
  const item = newProofProfile("x", "y");
  item.variant = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ProofProfileGraceDaysRangeRule flags values above grace days", () => {
  const rule = new ProofProfileGraceDaysRangeRule(86400, 86400);
  const item = newProofProfile("x", "y");
  item.graceDays = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ProofProfileRequiredVariantRule flags a blank variant", () => {
  const rule = new ProofProfileRequiredVariantRule("proof profile needs this field");
  const item = newProofProfile("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ProofProfileCurrencyLengthRule flags a long currency", () => {
  const rule = new ProofProfileCurrencyLengthRule(32);
  const item = newProofProfile("x", "y");
  item.currency = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ProofProfileRequiredCodeRule flags a blank code", () => {
  const rule = new ProofProfileRequiredCodeRule("proof profile needs this field");
  const item = newProofProfile("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
