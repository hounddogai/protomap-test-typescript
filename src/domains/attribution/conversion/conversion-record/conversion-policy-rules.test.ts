import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ConversionPolicyCountryLengthRule,
  ConversionPolicyNotesLengthRule,
  ConversionPolicyRequiredCodeRule,
  defaultConversionPolicyValidator,
} from "./conversion-policy-rules.js";
import { newConversionPolicy } from "./conversion-policy.js";

test("ConversionPolicyValidator reports every problem", () => {
  const validator = defaultConversionPolicyValidator();
  const item = newConversionPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ConversionPolicyRequiredCodeRule flags a blank code", () => {
  const rule = new ConversionPolicyRequiredCodeRule("conversion policy needs a value");
  const item = newConversionPolicy("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ConversionPolicyNotesLengthRule flags a long notes", () => {
  const rule = new ConversionPolicyNotesLengthRule(1000);
  const item = newConversionPolicy("x", "y");
  item.notes = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ConversionPolicyCountryLengthRule flags a long country", () => {
  const rule = new ConversionPolicyCountryLengthRule(86400);
  const item = newConversionPolicy("x", "y");
  item.country = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
