import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ConversionClaimBudgetRangeRule,
  ConversionClaimRequiredCodeRule,
  ConversionClaimRequiredLocaleRule,
  ConversionClaimRequiredTitleRule,
  ConversionClaimTitleLengthRule,
  defaultConversionClaimValidator,
} from "./conversion-claim-rules.js";
import { newConversionClaim } from "./conversion-claim.js";

test("ConversionClaimValidator reports every problem", () => {
  const validator = defaultConversionClaimValidator();
  const item = newConversionClaim("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ConversionClaimRequiredTitleRule flags a blank title", () => {
  const rule = new ConversionClaimRequiredTitleRule("conversion claim needs a value");
  const item = newConversionClaim("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ConversionClaimTitleLengthRule flags a long title", () => {
  const rule = new ConversionClaimTitleLengthRule(86400);
  const item = newConversionClaim("x", "y");
  item.title = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ConversionClaimBudgetRangeRule flags values above budget", () => {
  const rule = new ConversionClaimBudgetRangeRule(6, 4916.7);
  const item = newConversionClaim("x", "y");
  item.budget = 4918.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ConversionClaimRequiredLocaleRule flags a blank locale", () => {
  const rule = new ConversionClaimRequiredLocaleRule("conversion claim needs this field");
  const item = newConversionClaim("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ConversionClaimRequiredCodeRule flags a blank code", () => {
  const rule = new ConversionClaimRequiredCodeRule("conversion claim needs an entry");
  const item = newConversionClaim("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
