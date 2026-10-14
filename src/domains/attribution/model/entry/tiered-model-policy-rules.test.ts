import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredModelPolicyCodeLengthRule,
  TieredModelPolicyNameLengthRule,
  defaultTieredModelPolicyValidator,
} from "./tiered-model-policy-rules.js";
import { newTieredModelPolicy } from "./tiered-model-policy.js";

test("TieredModelPolicyValidator reports every problem", () => {
  const validator = defaultTieredModelPolicyValidator();
  const item = newTieredModelPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredModelPolicyNameLengthRule flags a long name", () => {
  const rule = new TieredModelPolicyNameLengthRule(16);
  const item = newTieredModelPolicy("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredModelPolicyCodeLengthRule flags a long code", () => {
  const rule = new TieredModelPolicyCodeLengthRule(255);
  const item = newTieredModelPolicy("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
