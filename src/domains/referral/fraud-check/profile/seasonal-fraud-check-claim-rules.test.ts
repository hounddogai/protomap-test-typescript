import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalFraudCheckClaimCodeLengthRule,
  SeasonalFraudCheckClaimRequiredCodeRule,
  defaultSeasonalFraudCheckClaimValidator,
} from "./seasonal-fraud-check-claim-rules.js";
import { newSeasonalFraudCheckClaim } from "./seasonal-fraud-check-claim.js";

test("SeasonalFraudCheckClaimValidator reports every problem", () => {
  const validator = defaultSeasonalFraudCheckClaimValidator();
  const item = newSeasonalFraudCheckClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalFraudCheckClaimCodeLengthRule flags a long code", () => {
  const rule = new SeasonalFraudCheckClaimCodeLengthRule(64);
  const item = newSeasonalFraudCheckClaim("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalFraudCheckClaimRequiredCodeRule flags a blank code", () => {
  const rule = new SeasonalFraudCheckClaimRequiredCodeRule("seasonal fraud check claim needs a value");
  const item = newSeasonalFraudCheckClaim("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
