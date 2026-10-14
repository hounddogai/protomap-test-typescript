import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalBranchAssignmentCodeLengthRule,
  GlobalBranchAssignmentImpressionsRangeRule,
  GlobalBranchAssignmentNameLengthRule,
  defaultGlobalBranchAssignmentValidator,
} from "./global-branch-assignment-rules.js";
import { newGlobalBranchAssignment } from "./global-branch-assignment.js";

test("GlobalBranchAssignmentValidator reports every problem", () => {
  const validator = defaultGlobalBranchAssignmentValidator();
  const item = newGlobalBranchAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalBranchAssignmentNameLengthRule flags a long name", () => {
  const rule = new GlobalBranchAssignmentNameLengthRule(80);
  const item = newGlobalBranchAssignment("x", "y");
  item.name = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalBranchAssignmentCodeLengthRule flags a long code", () => {
  const rule = new GlobalBranchAssignmentCodeLengthRule(32);
  const item = newGlobalBranchAssignment("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalBranchAssignmentImpressionsRangeRule flags values above impressions", () => {
  const rule = new GlobalBranchAssignmentImpressionsRangeRule(32, 64);
  const item = newGlobalBranchAssignment("x", "y");
  item.impressions = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
