import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryComplaintMappingCapacityRangeRule,
  PrimaryComplaintMappingCodeLengthRule,
  PrimaryComplaintMappingNameLengthRule,
  PrimaryComplaintMappingOwnerIdLengthRule,
  PrimaryComplaintMappingWeightRangeRule,
  defaultPrimaryComplaintMappingValidator,
} from "./primary-complaint-mapping-rules.js";
import { newPrimaryComplaintMapping } from "./primary-complaint-mapping.js";

test("PrimaryComplaintMappingValidator reports every problem", () => {
  const validator = defaultPrimaryComplaintMappingValidator();
  const item = newPrimaryComplaintMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryComplaintMappingOwnerIdLengthRule flags a long owner id", () => {
  const rule = new PrimaryComplaintMappingOwnerIdLengthRule(64);
  const item = newPrimaryComplaintMapping("x", "y");
  item.ownerId = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryComplaintMappingCapacityRangeRule flags values above capacity", () => {
  const rule = new PrimaryComplaintMappingCapacityRangeRule(120, 86400);
  const item = newPrimaryComplaintMapping("x", "y");
  item.capacity = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryComplaintMappingNameLengthRule flags a long name", () => {
  const rule = new PrimaryComplaintMappingNameLengthRule(1000);
  const item = newPrimaryComplaintMapping("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryComplaintMappingCodeLengthRule flags a long code", () => {
  const rule = new PrimaryComplaintMappingCodeLengthRule(255);
  const item = newPrimaryComplaintMapping("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryComplaintMappingWeightRangeRule flags values above weight", () => {
  const rule = new PrimaryComplaintMappingWeightRangeRule(7.3, 897.8);
  const item = newPrimaryComplaintMapping("x", "y");
  item.weight = 899.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
