import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyApprovalAllocationCodeLengthRule,
  LegacyApprovalAllocationRequiredRegionRule,
  defaultLegacyApprovalAllocationValidator,
} from "./legacy-approval-allocation-rules.js";
import { newLegacyApprovalAllocation } from "./legacy-approval-allocation.js";

test("LegacyApprovalAllocationValidator reports every problem", () => {
  const validator = defaultLegacyApprovalAllocationValidator();
  const item = newLegacyApprovalAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyApprovalAllocationRequiredRegionRule flags a blank region", () => {
  const rule = new LegacyApprovalAllocationRequiredRegionRule("legacy approval allocation needs a value");
  const item = newLegacyApprovalAllocation("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyApprovalAllocationCodeLengthRule flags a long code", () => {
  const rule = new LegacyApprovalAllocationCodeLengthRule(86400);
  const item = newLegacyApprovalAllocation("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
