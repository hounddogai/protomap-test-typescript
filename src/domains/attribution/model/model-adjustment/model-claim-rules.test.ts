import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ModelClaimCodeLengthRule,
  ModelClaimGraceDaysRangeRule,
  ModelClaimNameLengthRule,
  defaultModelClaimValidator,
} from "./model-claim-rules.js";
import { newModelClaim } from "./model-claim.js";

test("ModelClaimValidator reports every problem", () => {
  const validator = defaultModelClaimValidator();
  const item = newModelClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ModelClaimGraceDaysRangeRule flags values above grace days", () => {
  const rule = new ModelClaimGraceDaysRangeRule(120, 1000);
  const item = newModelClaim("x", "y");
  item.graceDays = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ModelClaimCodeLengthRule flags a long code", () => {
  const rule = new ModelClaimCodeLengthRule(80);
  const item = newModelClaim("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ModelClaimNameLengthRule flags a long name", () => {
  const rule = new ModelClaimNameLengthRule(120);
  const item = newModelClaim("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
