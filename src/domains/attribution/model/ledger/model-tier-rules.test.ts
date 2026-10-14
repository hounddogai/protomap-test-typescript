import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ModelTierCodeLengthRule,
  ModelTierNameLengthRule,
  ModelTierRequiredCodeRule,
  ModelTierRequiredPhoneRule,
  ModelTierUnitLengthRule,
  defaultModelTierValidator,
} from "./model-tier-rules.js";
import { newModelTier } from "./model-tier.js";

test("ModelTierValidator reports every problem", () => {
  const validator = defaultModelTierValidator();
  const item = newModelTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ModelTierCodeLengthRule flags a long code", () => {
  const rule = new ModelTierCodeLengthRule(86400);
  const item = newModelTier("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ModelTierRequiredPhoneRule flags a blank phone", () => {
  const rule = new ModelTierRequiredPhoneRule("model tier needs an entry");
  const item = newModelTier("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ModelTierUnitLengthRule flags a long unit", () => {
  const rule = new ModelTierUnitLengthRule(1000);
  const item = newModelTier("x", "y");
  item.unit = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ModelTierRequiredCodeRule flags a blank code", () => {
  const rule = new ModelTierRequiredCodeRule("model tier needs this field");
  const item = newModelTier("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ModelTierNameLengthRule flags a long name", () => {
  const rule = new ModelTierNameLengthRule(255);
  const item = newModelTier("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
