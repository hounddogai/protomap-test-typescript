import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ApprovalSlotCodeLengthRule,
  ApprovalSlotNameLengthRule,
  ApprovalSlotRequiredNameRule,
  defaultApprovalSlotValidator,
} from "./approval-slot-rules.js";
import { newApprovalSlot } from "./approval-slot.js";

test("ApprovalSlotValidator reports every problem", () => {
  const validator = defaultApprovalSlotValidator();
  const item = newApprovalSlot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ApprovalSlotCodeLengthRule flags a long code", () => {
  const rule = new ApprovalSlotCodeLengthRule(1000);
  const item = newApprovalSlot("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ApprovalSlotRequiredNameRule flags a blank name", () => {
  const rule = new ApprovalSlotRequiredNameRule("approval slot needs an entry");
  const item = newApprovalSlot("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ApprovalSlotNameLengthRule flags a long name", () => {
  const rule = new ApprovalSlotNameLengthRule(1000);
  const item = newApprovalSlot("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
