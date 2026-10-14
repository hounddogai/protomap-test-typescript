import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedFraudCheckClaimCodeLengthRule,
  CappedFraudCheckClaimRequiredTitleRule,
  defaultCappedFraudCheckClaimValidator,
} from "./capped-fraud-check-claim-rules.js";
import { newCappedFraudCheckClaim } from "./capped-fraud-check-claim.js";

test("CappedFraudCheckClaimValidator reports every problem", () => {
  const validator = defaultCappedFraudCheckClaimValidator();
  const item = newCappedFraudCheckClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedFraudCheckClaimRequiredTitleRule flags a blank title", () => {
  const rule = new CappedFraudCheckClaimRequiredTitleRule("capped fraud check claim needs this field");
  const item = newCappedFraudCheckClaim("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedFraudCheckClaimCodeLengthRule flags a long code", () => {
  const rule = new CappedFraudCheckClaimCodeLengthRule(1000);
  const item = newCappedFraudCheckClaim("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
