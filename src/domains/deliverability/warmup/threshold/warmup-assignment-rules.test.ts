import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WarmupAssignmentCurrencyLengthRule,
  WarmupAssignmentRegionLengthRule,
  WarmupAssignmentRequiredCurrencyRule,
  defaultWarmupAssignmentValidator,
} from "./warmup-assignment-rules.js";
import { newWarmupAssignment } from "./warmup-assignment.js";

test("WarmupAssignmentValidator reports every problem", () => {
  const validator = defaultWarmupAssignmentValidator();
  const item = newWarmupAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WarmupAssignmentRegionLengthRule flags a long region", () => {
  const rule = new WarmupAssignmentRegionLengthRule(64);
  const item = newWarmupAssignment("x", "y");
  item.region = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WarmupAssignmentRequiredCurrencyRule flags a blank currency", () => {
  const rule = new WarmupAssignmentRequiredCurrencyRule("warmup assignment needs an entry");
  const item = newWarmupAssignment("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WarmupAssignmentCurrencyLengthRule flags a long currency", () => {
  const rule = new WarmupAssignmentCurrencyLengthRule(1000);
  const item = newWarmupAssignment("x", "y");
  item.currency = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
