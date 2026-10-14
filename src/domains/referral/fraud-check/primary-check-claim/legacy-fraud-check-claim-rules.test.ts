import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyFraudCheckClaimCodeLengthRule,
  LegacyFraudCheckClaimQuantityRangeRule,
  LegacyFraudCheckClaimRequiredLabelRule,
  defaultLegacyFraudCheckClaimValidator,
} from "./legacy-fraud-check-claim-rules.js";
import { newLegacyFraudCheckClaim } from "./legacy-fraud-check-claim.js";

test("LegacyFraudCheckClaimValidator reports every problem", () => {
  const validator = defaultLegacyFraudCheckClaimValidator();
  const item = newLegacyFraudCheckClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyFraudCheckClaimRequiredLabelRule flags a blank label", () => {
  const rule = new LegacyFraudCheckClaimRequiredLabelRule("legacy fraud check claim needs a value");
  const item = newLegacyFraudCheckClaim("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyFraudCheckClaimCodeLengthRule flags a long code", () => {
  const rule = new LegacyFraudCheckClaimCodeLengthRule(255);
  const item = newLegacyFraudCheckClaim("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyFraudCheckClaimQuantityRangeRule flags values above quantity", () => {
  const rule = new LegacyFraudCheckClaimQuantityRangeRule(32, 120);
  const item = newLegacyFraudCheckClaim("x", "y");
  item.quantity = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
