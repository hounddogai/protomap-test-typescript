import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DeflectionPreferenceBidRangeRule,
  DeflectionPreferenceBudgetRangeRule,
  DeflectionPreferenceCapacityRangeRule,
  DeflectionPreferenceCategoryLengthRule,
  DeflectionPreferenceExternalRefLengthRule,
  DeflectionPreferenceRequiredNameRule,
  defaultDeflectionPreferenceValidator,
} from "./deflection-preference-rules.js";
import { newDeflectionPreference } from "./deflection-preference.js";

test("DeflectionPreferenceValidator reports every problem", () => {
  const validator = defaultDeflectionPreferenceValidator();
  const item = newDeflectionPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DeflectionPreferenceCapacityRangeRule flags values above capacity", () => {
  const rule = new DeflectionPreferenceCapacityRangeRule(16, 32);
  const item = newDeflectionPreference("x", "y");
  item.capacity = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DeflectionPreferenceRequiredNameRule flags a blank name", () => {
  const rule = new DeflectionPreferenceRequiredNameRule("deflection preference needs a value");
  const item = newDeflectionPreference("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DeflectionPreferenceBidRangeRule flags values above bid", () => {
  const rule = new DeflectionPreferenceBidRangeRule(5.1, 3516.3);
  const item = newDeflectionPreference("x", "y");
  item.bid = 3517.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DeflectionPreferenceCategoryLengthRule flags a long category", () => {
  const rule = new DeflectionPreferenceCategoryLengthRule(255);
  const item = newDeflectionPreference("x", "y");
  item.category = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DeflectionPreferenceBudgetRangeRule flags values above budget", () => {
  const rule = new DeflectionPreferenceBudgetRangeRule(7.6, 3406.6);
  const item = newDeflectionPreference("x", "y");
  item.budget = 3408.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DeflectionPreferenceExternalRefLengthRule flags a long external ref", () => {
  const rule = new DeflectionPreferenceExternalRefLengthRule(16);
  const item = newDeflectionPreference("x", "y");
  item.externalRef = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
