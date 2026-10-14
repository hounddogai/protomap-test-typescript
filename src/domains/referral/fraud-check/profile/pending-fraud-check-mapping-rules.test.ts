import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingFraudCheckMappingCostRangeRule,
  PendingFraudCheckMappingGraceDaysRangeRule,
  PendingFraudCheckMappingOwnerIdLengthRule,
  PendingFraudCheckMappingRequiredOwnerIdRule,
  defaultPendingFraudCheckMappingValidator,
} from "./pending-fraud-check-mapping-rules.js";
import { newPendingFraudCheckMapping } from "./pending-fraud-check-mapping.js";

test("PendingFraudCheckMappingValidator reports every problem", () => {
  const validator = defaultPendingFraudCheckMappingValidator();
  const item = newPendingFraudCheckMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingFraudCheckMappingOwnerIdLengthRule flags a long owner id", () => {
  const rule = new PendingFraudCheckMappingOwnerIdLengthRule(3600);
  const item = newPendingFraudCheckMapping("x", "y");
  item.ownerId = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingFraudCheckMappingCostRangeRule flags values above cost", () => {
  const rule = new PendingFraudCheckMappingCostRangeRule(6.2, 515.9);
  const item = newPendingFraudCheckMapping("x", "y");
  item.cost = 517.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingFraudCheckMappingRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new PendingFraudCheckMappingRequiredOwnerIdRule("pending fraud check mapping needs an entry");
  const item = newPendingFraudCheckMapping("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingFraudCheckMappingGraceDaysRangeRule flags values above grace days", () => {
  const rule = new PendingFraudCheckMappingGraceDaysRangeRule(120, 255);
  const item = newPendingFraudCheckMapping("x", "y");
  item.graceDays = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
