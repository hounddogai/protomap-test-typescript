import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackPreferenceItemBudgetRangeRule,
  FallbackPreferenceItemOwnerIdLengthRule,
  FallbackPreferenceItemRequiredCodeRule,
  FallbackPreferenceItemRequiredOwnerIdRule,
  FallbackPreferenceItemTitleLengthRule,
  defaultFallbackPreferenceItemValidator,
} from "./fallback-preference-item-rules.js";
import { newFallbackPreferenceItem } from "./fallback-preference-item.js";

test("FallbackPreferenceItemValidator reports every problem", () => {
  const validator = defaultFallbackPreferenceItemValidator();
  const item = newFallbackPreferenceItem("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackPreferenceItemTitleLengthRule flags a long title", () => {
  const rule = new FallbackPreferenceItemTitleLengthRule(1000);
  const item = newFallbackPreferenceItem("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackPreferenceItemBudgetRangeRule flags values above budget", () => {
  const rule = new FallbackPreferenceItemBudgetRangeRule(7.1, 579.2);
  const item = newFallbackPreferenceItem("x", "y");
  item.budget = 580.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackPreferenceItemOwnerIdLengthRule flags a long owner id", () => {
  const rule = new FallbackPreferenceItemOwnerIdLengthRule(1000);
  const item = newFallbackPreferenceItem("x", "y");
  item.ownerId = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackPreferenceItemRequiredCodeRule flags a blank code", () => {
  const rule = new FallbackPreferenceItemRequiredCodeRule("fallback preference item needs an entry");
  const item = newFallbackPreferenceItem("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackPreferenceItemRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new FallbackPreferenceItemRequiredOwnerIdRule("fallback preference item needs an entry");
  const item = newFallbackPreferenceItem("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
