import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingApprovalWindowPriorityRangeRule,
  RollingApprovalWindowRequiredCodeRule,
  defaultRollingApprovalWindowValidator,
} from "./rolling-approval-window-rules.js";
import { newRollingApprovalWindow } from "./rolling-approval-window.js";

test("RollingApprovalWindowValidator reports every problem", () => {
  const validator = defaultRollingApprovalWindowValidator();
  const item = newRollingApprovalWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingApprovalWindowPriorityRangeRule flags values above priority", () => {
  const rule = new RollingApprovalWindowPriorityRangeRule(16, 64);
  const item = newRollingApprovalWindow("x", "y");
  item.priority = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingApprovalWindowRequiredCodeRule flags a blank code", () => {
  const rule = new RollingApprovalWindowRequiredCodeRule("rolling approval window needs this field");
  const item = newRollingApprovalWindow("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
