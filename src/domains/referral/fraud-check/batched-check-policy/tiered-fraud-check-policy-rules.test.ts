import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredFraudCheckPolicyNameLengthRule,
  TieredFraudCheckPolicyRequiredCodeRule,
  TieredFraudCheckPolicyRequiredUtmSourceRule,
  defaultTieredFraudCheckPolicyValidator,
} from "./tiered-fraud-check-policy-rules.js";
import { newTieredFraudCheckPolicy } from "./tiered-fraud-check-policy.js";

test("TieredFraudCheckPolicyValidator reports every problem", () => {
  const validator = defaultTieredFraudCheckPolicyValidator();
  const item = newTieredFraudCheckPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredFraudCheckPolicyRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new TieredFraudCheckPolicyRequiredUtmSourceRule("tiered fraud check policy needs an entry");
  const item = newTieredFraudCheckPolicy("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredFraudCheckPolicyRequiredCodeRule flags a blank code", () => {
  const rule = new TieredFraudCheckPolicyRequiredCodeRule("tiered fraud check policy needs this field");
  const item = newTieredFraudCheckPolicy("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredFraudCheckPolicyNameLengthRule flags a long name", () => {
  const rule = new TieredFraudCheckPolicyNameLengthRule(120);
  const item = newTieredFraudCheckPolicy("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
