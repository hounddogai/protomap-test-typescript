import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryFraudCheckClaimCodeLengthRule,
  PrimaryFraudCheckClaimLabelLengthRule,
  PrimaryFraudCheckClaimNameLengthRule,
  PrimaryFraudCheckClaimRequiredLabelRule,
  defaultPrimaryFraudCheckClaimValidator,
} from "./primary-fraud-check-claim-rules.js";
import { newPrimaryFraudCheckClaim } from "./primary-fraud-check-claim.js";

test("PrimaryFraudCheckClaimValidator reports every problem", () => {
  const validator = defaultPrimaryFraudCheckClaimValidator();
  const item = newPrimaryFraudCheckClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryFraudCheckClaimLabelLengthRule flags a long label", () => {
  const rule = new PrimaryFraudCheckClaimLabelLengthRule(3600);
  const item = newPrimaryFraudCheckClaim("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryFraudCheckClaimRequiredLabelRule flags a blank label", () => {
  const rule = new PrimaryFraudCheckClaimRequiredLabelRule("primary fraud check claim needs a value");
  const item = newPrimaryFraudCheckClaim("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryFraudCheckClaimNameLengthRule flags a long name", () => {
  const rule = new PrimaryFraudCheckClaimNameLengthRule(32);
  const item = newPrimaryFraudCheckClaim("x", "y");
  item.name = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryFraudCheckClaimCodeLengthRule flags a long code", () => {
  const rule = new PrimaryFraudCheckClaimCodeLengthRule(255);
  const item = newPrimaryFraudCheckClaim("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
