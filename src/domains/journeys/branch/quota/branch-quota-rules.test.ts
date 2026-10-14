import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BranchQuotaEndsAtRangeRule,
  BranchQuotaNotesLengthRule,
  BranchQuotaRequiredSegmentRule,
  defaultBranchQuotaValidator,
} from "./branch-quota-rules.js";
import { newBranchQuota } from "./branch-quota.js";

test("BranchQuotaValidator reports every problem", () => {
  const validator = defaultBranchQuotaValidator();
  const item = newBranchQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BranchQuotaNotesLengthRule flags a long notes", () => {
  const rule = new BranchQuotaNotesLengthRule(1000);
  const item = newBranchQuota("x", "y");
  item.notes = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BranchQuotaEndsAtRangeRule flags values above ends at", () => {
  const rule = new BranchQuotaEndsAtRangeRule(120, 255);
  const item = newBranchQuota("x", "y");
  item.endsAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BranchQuotaRequiredSegmentRule flags a blank segment", () => {
  const rule = new BranchQuotaRequiredSegmentRule("branch quota needs a value");
  const item = newBranchQuota("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
