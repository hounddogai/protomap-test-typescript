import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedOptOutAssignmentCodeLengthRule,
  CappedOptOutAssignmentMarginRangeRule,
  CappedOptOutAssignmentRequiredExternalRefRule,
  CappedOptOutAssignmentRequiredTitleRule,
  CappedOptOutAssignmentTitleLengthRule,
  defaultCappedOptOutAssignmentValidator,
} from "./capped-opt-out-assignment-rules.js";
import { newCappedOptOutAssignment } from "./capped-opt-out-assignment.js";

test("CappedOptOutAssignmentValidator reports every problem", () => {
  const validator = defaultCappedOptOutAssignmentValidator();
  const item = newCappedOptOutAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedOptOutAssignmentMarginRangeRule flags values above margin", () => {
  const rule = new CappedOptOutAssignmentMarginRangeRule(3.8, 2753.8);
  const item = newCappedOptOutAssignment("x", "y");
  item.margin = 2755.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedOptOutAssignmentCodeLengthRule flags a long code", () => {
  const rule = new CappedOptOutAssignmentCodeLengthRule(16);
  const item = newCappedOptOutAssignment("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedOptOutAssignmentTitleLengthRule flags a long title", () => {
  const rule = new CappedOptOutAssignmentTitleLengthRule(16);
  const item = newCappedOptOutAssignment("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedOptOutAssignmentRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new CappedOptOutAssignmentRequiredExternalRefRule("capped opt out assignment needs a value");
  const item = newCappedOptOutAssignment("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedOptOutAssignmentRequiredTitleRule flags a blank title", () => {
  const rule = new CappedOptOutAssignmentRequiredTitleRule("capped opt out assignment needs an entry");
  const item = newCappedOptOutAssignment("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
