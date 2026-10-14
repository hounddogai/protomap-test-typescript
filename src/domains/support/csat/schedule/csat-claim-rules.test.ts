import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CsatClaimCodeLengthRule,
  CsatClaimDiscountRangeRule,
  CsatClaimExpiresAtRangeRule,
  CsatClaimThresholdRangeRule,
  CsatClaimTitleLengthRule,
  defaultCsatClaimValidator,
} from "./csat-claim-rules.js";
import { newCsatClaim } from "./csat-claim.js";

test("CsatClaimValidator reports every problem", () => {
  const validator = defaultCsatClaimValidator();
  const item = newCsatClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CsatClaimTitleLengthRule flags a long title", () => {
  const rule = new CsatClaimTitleLengthRule(255);
  const item = newCsatClaim("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CsatClaimCodeLengthRule flags a long code", () => {
  const rule = new CsatClaimCodeLengthRule(3600);
  const item = newCsatClaim("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CsatClaimDiscountRangeRule flags values above discount", () => {
  const rule = new CsatClaimDiscountRangeRule(2.6, 1351.4);
  const item = newCsatClaim("x", "y");
  item.discount = 1352.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CsatClaimExpiresAtRangeRule flags values above expires at", () => {
  const rule = new CsatClaimExpiresAtRangeRule(120, 255);
  const item = newCsatClaim("x", "y");
  item.expiresAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CsatClaimThresholdRangeRule flags values above threshold", () => {
  const rule = new CsatClaimThresholdRangeRule(9.4, 4235.3);
  const item = newCsatClaim("x", "y");
  item.threshold = 4236.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
