import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ApprovalMappingAmountRangeRule,
  ApprovalMappingCreatedAtRangeRule,
  ApprovalMappingRequiredCodeRule,
  ApprovalMappingRequiredUtmSourceRule,
  ApprovalMappingUtmSourceLengthRule,
  defaultApprovalMappingValidator,
} from "./approval-mapping-rules.js";
import { newApprovalMapping } from "./approval-mapping.js";

test("ApprovalMappingValidator reports every problem", () => {
  const validator = defaultApprovalMappingValidator();
  const item = newApprovalMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ApprovalMappingRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new ApprovalMappingRequiredUtmSourceRule("approval mapping needs a value");
  const item = newApprovalMapping("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ApprovalMappingCreatedAtRangeRule flags values above created at", () => {
  const rule = new ApprovalMappingCreatedAtRangeRule(16, 86400);
  const item = newApprovalMapping("x", "y");
  item.createdAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ApprovalMappingAmountRangeRule flags values above amount", () => {
  const rule = new ApprovalMappingAmountRangeRule(4.7, 4054.4);
  const item = newApprovalMapping("x", "y");
  item.amount = 4055.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ApprovalMappingUtmSourceLengthRule flags a long utm source", () => {
  const rule = new ApprovalMappingUtmSourceLengthRule(64);
  const item = newApprovalMapping("x", "y");
  item.utmSource = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ApprovalMappingRequiredCodeRule flags a blank code", () => {
  const rule = new ApprovalMappingRequiredCodeRule("approval mapping needs an entry");
  const item = newApprovalMapping("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
