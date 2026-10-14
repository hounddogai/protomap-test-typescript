import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ReputationClaimLabelLengthRule,
  ReputationClaimRateRangeRule,
  ReputationClaimRequiredLabelRule,
  ReputationClaimRevisionRangeRule,
  defaultReputationClaimValidator,
} from "./reputation-claim-rules.js";
import { newReputationClaim } from "./reputation-claim.js";

test("ReputationClaimValidator reports every problem", () => {
  const validator = defaultReputationClaimValidator();
  const item = newReputationClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ReputationClaimLabelLengthRule flags a long label", () => {
  const rule = new ReputationClaimLabelLengthRule(1000);
  const item = newReputationClaim("x", "y");
  item.label = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ReputationClaimRequiredLabelRule flags a blank label", () => {
  const rule = new ReputationClaimRequiredLabelRule("reputation claim needs a value");
  const item = newReputationClaim("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReputationClaimRateRangeRule flags values above rate", () => {
  const rule = new ReputationClaimRateRangeRule(6.2, 4282.8);
  const item = newReputationClaim("x", "y");
  item.rate = 4284.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ReputationClaimRevisionRangeRule flags values above revision", () => {
  const rule = new ReputationClaimRevisionRangeRule(255, 255);
  const item = newReputationClaim("x", "y");
  item.revision = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
