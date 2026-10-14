import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultApprovalWindowEndsAtRangeRule,
  DefaultApprovalWindowNameLengthRule,
  DefaultApprovalWindowRequiredNameRule,
  DefaultApprovalWindowWeightRangeRule,
  defaultDefaultApprovalWindowValidator,
} from "./default-approval-window-rules.js";
import { newDefaultApprovalWindow } from "./default-approval-window.js";

test("DefaultApprovalWindowValidator reports every problem", () => {
  const validator = defaultDefaultApprovalWindowValidator();
  const item = newDefaultApprovalWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultApprovalWindowNameLengthRule flags a long name", () => {
  const rule = new DefaultApprovalWindowNameLengthRule(3600);
  const item = newDefaultApprovalWindow("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultApprovalWindowEndsAtRangeRule flags values above ends at", () => {
  const rule = new DefaultApprovalWindowEndsAtRangeRule(32, 64);
  const item = newDefaultApprovalWindow("x", "y");
  item.endsAt = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultApprovalWindowRequiredNameRule flags a blank name", () => {
  const rule = new DefaultApprovalWindowRequiredNameRule("default approval window needs a value");
  const item = newDefaultApprovalWindow("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultApprovalWindowWeightRangeRule flags values above weight", () => {
  const rule = new DefaultApprovalWindowWeightRangeRule(8.5, 500.4);
  const item = newDefaultApprovalWindow("x", "y");
  item.weight = 501.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
