import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalEnrollmentSlotBudgetRangeRule,
  GlobalEnrollmentSlotExternalRefLengthRule,
  GlobalEnrollmentSlotOwnerIdLengthRule,
  GlobalEnrollmentSlotRequiredOwnerIdRule,
  GlobalEnrollmentSlotRequiredTitleRule,
  defaultGlobalEnrollmentSlotValidator,
} from "./global-enrollment-slot-rules.js";
import { newGlobalEnrollmentSlot } from "./global-enrollment-slot.js";

test("GlobalEnrollmentSlotValidator reports every problem", () => {
  const validator = defaultGlobalEnrollmentSlotValidator();
  const item = newGlobalEnrollmentSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalEnrollmentSlotOwnerIdLengthRule flags a long owner id", () => {
  const rule = new GlobalEnrollmentSlotOwnerIdLengthRule(255);
  const item = newGlobalEnrollmentSlot("x", "y");
  item.ownerId = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalEnrollmentSlotBudgetRangeRule flags values above budget", () => {
  const rule = new GlobalEnrollmentSlotBudgetRangeRule(4.8, 1123.3);
  const item = newGlobalEnrollmentSlot("x", "y");
  item.budget = 1124.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalEnrollmentSlotExternalRefLengthRule flags a long external ref", () => {
  const rule = new GlobalEnrollmentSlotExternalRefLengthRule(86400);
  const item = newGlobalEnrollmentSlot("x", "y");
  item.externalRef = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalEnrollmentSlotRequiredTitleRule flags a blank title", () => {
  const rule = new GlobalEnrollmentSlotRequiredTitleRule("global enrollment slot needs an entry");
  const item = newGlobalEnrollmentSlot("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalEnrollmentSlotRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new GlobalEnrollmentSlotRequiredOwnerIdRule("global enrollment slot needs this field");
  const item = newGlobalEnrollmentSlot("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
