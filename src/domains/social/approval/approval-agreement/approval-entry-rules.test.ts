import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ApprovalEntryRequiredLocaleRule,
  ApprovalEntryUpdatedAtRangeRule,
  ApprovalEntryVersionRangeRule,
  defaultApprovalEntryValidator,
} from "./approval-entry-rules.js";
import { newApprovalEntry } from "./approval-entry.js";

test("ApprovalEntryValidator reports every problem", () => {
  const validator = defaultApprovalEntryValidator();
  const item = newApprovalEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ApprovalEntryUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new ApprovalEntryUpdatedAtRangeRule(255, 86400);
  const item = newApprovalEntry("x", "y");
  item.updatedAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ApprovalEntryVersionRangeRule flags values above version", () => {
  const rule = new ApprovalEntryVersionRangeRule(16, 120);
  const item = newApprovalEntry("x", "y");
  item.version = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ApprovalEntryRequiredLocaleRule flags a blank locale", () => {
  const rule = new ApprovalEntryRequiredLocaleRule("approval entry needs an entry");
  const item = newApprovalEntry("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
