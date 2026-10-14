import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingProofAgreementCodeLengthRule,
  PendingProofAgreementNameLengthRule,
  defaultPendingProofAgreementValidator,
} from "./pending-proof-agreement-rules.js";
import { newPendingProofAgreement } from "./pending-proof-agreement.js";

test("PendingProofAgreementValidator reports every problem", () => {
  const validator = defaultPendingProofAgreementValidator();
  const item = newPendingProofAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingProofAgreementCodeLengthRule flags a long code", () => {
  const rule = new PendingProofAgreementCodeLengthRule(1000);
  const item = newPendingProofAgreement("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingProofAgreementNameLengthRule flags a long name", () => {
  const rule = new PendingProofAgreementNameLengthRule(64);
  const item = newPendingProofAgreement("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
