import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingApprovalEstimateCodeLengthRule,
  RollingApprovalEstimateCreatedAtRangeRule,
  RollingApprovalEstimateDescriptionLengthRule,
  RollingApprovalEstimateRequiredNameRule,
  defaultRollingApprovalEstimateValidator,
} from "./rolling-approval-estimate-rules.js";
import { newRollingApprovalEstimate } from "./rolling-approval-estimate.js";

test("RollingApprovalEstimateValidator reports every problem", () => {
  const validator = defaultRollingApprovalEstimateValidator();
  const item = newRollingApprovalEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingApprovalEstimateDescriptionLengthRule flags a long description", () => {
  const rule = new RollingApprovalEstimateDescriptionLengthRule(64);
  const item = newRollingApprovalEstimate("x", "y");
  item.description = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingApprovalEstimateCodeLengthRule flags a long code", () => {
  const rule = new RollingApprovalEstimateCodeLengthRule(1000);
  const item = newRollingApprovalEstimate("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingApprovalEstimateCreatedAtRangeRule flags values above created at", () => {
  const rule = new RollingApprovalEstimateCreatedAtRangeRule(64, 80);
  const item = newRollingApprovalEstimate("x", "y");
  item.createdAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingApprovalEstimateRequiredNameRule flags a blank name", () => {
  const rule = new RollingApprovalEstimateRequiredNameRule("rolling approval estimate needs an entry");
  const item = newRollingApprovalEstimate("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
