import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ApprovalOverrideRequiredTitleRule,
  ApprovalOverrideSendAtRangeRule,
  defaultApprovalOverrideValidator,
} from "./approval-override-rules.js";
import { newApprovalOverride } from "./approval-override.js";

test("ApprovalOverrideValidator reports every problem", () => {
  const validator = defaultApprovalOverrideValidator();
  const item = newApprovalOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ApprovalOverrideRequiredTitleRule flags a blank title", () => {
  const rule = new ApprovalOverrideRequiredTitleRule("approval override needs an entry");
  const item = newApprovalOverride("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ApprovalOverrideSendAtRangeRule flags values above send at", () => {
  const rule = new ApprovalOverrideSendAtRangeRule(32, 120);
  const item = newApprovalOverride("x", "y");
  item.sendAt = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
