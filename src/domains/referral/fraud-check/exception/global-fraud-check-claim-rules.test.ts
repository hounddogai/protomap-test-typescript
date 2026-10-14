import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalFraudCheckClaimNotesLengthRule,
  GlobalFraudCheckClaimRequiredNotesRule,
  GlobalFraudCheckClaimTitleLengthRule,
  defaultGlobalFraudCheckClaimValidator,
} from "./global-fraud-check-claim-rules.js";
import { newGlobalFraudCheckClaim } from "./global-fraud-check-claim.js";

test("GlobalFraudCheckClaimValidator reports every problem", () => {
  const validator = defaultGlobalFraudCheckClaimValidator();
  const item = newGlobalFraudCheckClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalFraudCheckClaimNotesLengthRule flags a long notes", () => {
  const rule = new GlobalFraudCheckClaimNotesLengthRule(3600);
  const item = newGlobalFraudCheckClaim("x", "y");
  item.notes = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalFraudCheckClaimRequiredNotesRule flags a blank notes", () => {
  const rule = new GlobalFraudCheckClaimRequiredNotesRule("global fraud check claim needs a value");
  const item = newGlobalFraudCheckClaim("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalFraudCheckClaimTitleLengthRule flags a long title", () => {
  const rule = new GlobalFraudCheckClaimTitleLengthRule(80);
  const item = newGlobalFraudCheckClaim("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
