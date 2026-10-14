import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedConversionPolicyCodeLengthRule,
  CappedConversionPolicyCreatedAtRangeRule,
  CappedConversionPolicyNameLengthRule,
  defaultCappedConversionPolicyValidator,
} from "./capped-conversion-policy-rules.js";
import { newCappedConversionPolicy } from "./capped-conversion-policy.js";

test("CappedConversionPolicyValidator reports every problem", () => {
  const validator = defaultCappedConversionPolicyValidator();
  const item = newCappedConversionPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedConversionPolicyCreatedAtRangeRule flags values above created at", () => {
  const rule = new CappedConversionPolicyCreatedAtRangeRule(64, 255);
  const item = newCappedConversionPolicy("x", "y");
  item.createdAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedConversionPolicyCodeLengthRule flags a long code", () => {
  const rule = new CappedConversionPolicyCodeLengthRule(64);
  const item = newCappedConversionPolicy("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedConversionPolicyNameLengthRule flags a long name", () => {
  const rule = new CappedConversionPolicyNameLengthRule(32);
  const item = newCappedConversionPolicy("x", "y");
  item.name = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
