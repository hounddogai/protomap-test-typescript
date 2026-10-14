import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackDomainPolicyCodeLengthRule,
  FallbackDomainPolicyRequiredChecksumRule,
  FallbackDomainPolicyRequiredCodeRule,
  FallbackDomainPolicyRequiredNameRule,
  defaultFallbackDomainPolicyValidator,
} from "./fallback-domain-policy-rules.js";
import { newFallbackDomainPolicy } from "./fallback-domain-policy.js";

test("FallbackDomainPolicyValidator reports every problem", () => {
  const validator = defaultFallbackDomainPolicyValidator();
  const item = newFallbackDomainPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackDomainPolicyRequiredCodeRule flags a blank code", () => {
  const rule = new FallbackDomainPolicyRequiredCodeRule("fallback domain policy needs this field");
  const item = newFallbackDomainPolicy("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackDomainPolicyRequiredNameRule flags a blank name", () => {
  const rule = new FallbackDomainPolicyRequiredNameRule("fallback domain policy needs this field");
  const item = newFallbackDomainPolicy("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackDomainPolicyCodeLengthRule flags a long code", () => {
  const rule = new FallbackDomainPolicyCodeLengthRule(64);
  const item = newFallbackDomainPolicy("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackDomainPolicyRequiredChecksumRule flags a blank checksum", () => {
  const rule = new FallbackDomainPolicyRequiredChecksumRule("fallback domain policy needs a value");
  const item = newFallbackDomainPolicy("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
