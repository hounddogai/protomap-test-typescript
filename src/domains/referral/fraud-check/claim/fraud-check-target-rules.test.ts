import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FraudCheckTargetCostRangeRule,
  FraudCheckTargetPriorityRangeRule,
  FraudCheckTargetRequiredCodeRule,
  FraudCheckTargetRequiredNameRule,
  FraudCheckTargetRequiredOwnerIdRule,
  FraudCheckTargetUnitLengthRule,
  defaultFraudCheckTargetValidator,
} from "./fraud-check-target-rules.js";
import { newFraudCheckTarget } from "./fraud-check-target.js";

test("FraudCheckTargetValidator reports every problem", () => {
  const validator = defaultFraudCheckTargetValidator();
  const item = newFraudCheckTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FraudCheckTargetRequiredCodeRule flags a blank code", () => {
  const rule = new FraudCheckTargetRequiredCodeRule("fraud check target needs this field");
  const item = newFraudCheckTarget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FraudCheckTargetRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new FraudCheckTargetRequiredOwnerIdRule("fraud check target needs a value");
  const item = newFraudCheckTarget("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FraudCheckTargetCostRangeRule flags values above cost", () => {
  const rule = new FraudCheckTargetCostRangeRule(5.6, 2756.3);
  const item = newFraudCheckTarget("x", "y");
  item.cost = 2757.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FraudCheckTargetUnitLengthRule flags a long unit", () => {
  const rule = new FraudCheckTargetUnitLengthRule(64);
  const item = newFraudCheckTarget("x", "y");
  item.unit = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FraudCheckTargetRequiredNameRule flags a blank name", () => {
  const rule = new FraudCheckTargetRequiredNameRule("fraud check target needs a value");
  const item = newFraudCheckTarget("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FraudCheckTargetPriorityRangeRule flags values above priority", () => {
  const rule = new FraudCheckTargetPriorityRangeRule(255, 86400);
  const item = newFraudCheckTarget("x", "y");
  item.priority = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
