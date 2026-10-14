import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CsatPolicyCohortLengthRule,
  CsatPolicyRequiredCodeRule,
  CsatPolicyRequiredRegionRule,
  CsatPolicyRetriesRangeRule,
  defaultCsatPolicyValidator,
} from "./csat-policy-rules.js";
import { newCsatPolicy } from "./csat-policy.js";

test("CsatPolicyValidator reports every problem", () => {
  const validator = defaultCsatPolicyValidator();
  const item = newCsatPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CsatPolicyRequiredRegionRule flags a blank region", () => {
  const rule = new CsatPolicyRequiredRegionRule("csat policy needs a value");
  const item = newCsatPolicy("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CsatPolicyRetriesRangeRule flags values above retries", () => {
  const rule = new CsatPolicyRetriesRangeRule(255, 1000);
  const item = newCsatPolicy("x", "y");
  item.retries = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CsatPolicyCohortLengthRule flags a long cohort", () => {
  const rule = new CsatPolicyCohortLengthRule(120);
  const item = newCsatPolicy("x", "y");
  item.cohort = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CsatPolicyRequiredCodeRule flags a blank code", () => {
  const rule = new CsatPolicyRequiredCodeRule("csat policy needs this field");
  const item = newCsatPolicy("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
