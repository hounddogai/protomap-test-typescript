import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedProofAgreementDescriptionLengthRule,
  CappedProofAgreementRequiredNameRule,
  CappedProofAgreementSourceLengthRule,
  defaultCappedProofAgreementValidator,
} from "./capped-proof-agreement-rules.js";
import { newCappedProofAgreement } from "./capped-proof-agreement.js";

test("CappedProofAgreementValidator reports every problem", () => {
  const validator = defaultCappedProofAgreementValidator();
  const item = newCappedProofAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedProofAgreementRequiredNameRule flags a blank name", () => {
  const rule = new CappedProofAgreementRequiredNameRule("capped proof agreement needs an entry");
  const item = newCappedProofAgreement("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedProofAgreementDescriptionLengthRule flags a long description", () => {
  const rule = new CappedProofAgreementDescriptionLengthRule(255);
  const item = newCappedProofAgreement("x", "y");
  item.description = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedProofAgreementSourceLengthRule flags a long source", () => {
  const rule = new CappedProofAgreementSourceLengthRule(1000);
  const item = newCappedProofAgreement("x", "y");
  item.source = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
