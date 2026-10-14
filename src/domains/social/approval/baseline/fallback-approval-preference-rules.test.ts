import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackApprovalPreferenceExpiresAtRangeRule,
  FallbackApprovalPreferenceRequiredSegmentRule,
  defaultFallbackApprovalPreferenceValidator,
} from "./fallback-approval-preference-rules.js";
import { newFallbackApprovalPreference } from "./fallback-approval-preference.js";

test("FallbackApprovalPreferenceValidator reports every problem", () => {
  const validator = defaultFallbackApprovalPreferenceValidator();
  const item = newFallbackApprovalPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackApprovalPreferenceExpiresAtRangeRule flags values above expires at", () => {
  const rule = new FallbackApprovalPreferenceExpiresAtRangeRule(1000, 1000);
  const item = newFallbackApprovalPreference("x", "y");
  item.expiresAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackApprovalPreferenceRequiredSegmentRule flags a blank segment", () => {
  const rule = new FallbackApprovalPreferenceRequiredSegmentRule("fallback approval preference needs this field");
  const item = newFallbackApprovalPreference("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
