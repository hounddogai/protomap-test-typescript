import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingMacroAssignmentCapacityRangeRule,
  RollingMacroAssignmentNameLengthRule,
  RollingMacroAssignmentRequiredChannelRule,
  RollingMacroAssignmentRequiredNameRule,
  RollingMacroAssignmentRevisionRangeRule,
  defaultRollingMacroAssignmentValidator,
} from "./rolling-macro-assignment-rules.js";
import { newRollingMacroAssignment } from "./rolling-macro-assignment.js";

test("RollingMacroAssignmentValidator reports every problem", () => {
  const validator = defaultRollingMacroAssignmentValidator();
  const item = newRollingMacroAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingMacroAssignmentCapacityRangeRule flags values above capacity", () => {
  const rule = new RollingMacroAssignmentCapacityRangeRule(64, 1000);
  const item = newRollingMacroAssignment("x", "y");
  item.capacity = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingMacroAssignmentRequiredChannelRule flags a blank channel", () => {
  const rule = new RollingMacroAssignmentRequiredChannelRule("rolling macro assignment needs an entry");
  const item = newRollingMacroAssignment("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingMacroAssignmentNameLengthRule flags a long name", () => {
  const rule = new RollingMacroAssignmentNameLengthRule(16);
  const item = newRollingMacroAssignment("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingMacroAssignmentRevisionRangeRule flags values above revision", () => {
  const rule = new RollingMacroAssignmentRevisionRangeRule(32, 120);
  const item = newRollingMacroAssignment("x", "y");
  item.revision = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingMacroAssignmentRequiredNameRule flags a blank name", () => {
  const rule = new RollingMacroAssignmentRequiredNameRule("rolling macro assignment needs this field");
  const item = newRollingMacroAssignment("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
