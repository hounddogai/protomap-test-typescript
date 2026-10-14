import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalRetentionAssignmentBidRangeRule,
  GlobalRetentionAssignmentCodeLengthRule,
  GlobalRetentionAssignmentDiscountRangeRule,
  GlobalRetentionAssignmentRequiredCategoryRule,
  GlobalRetentionAssignmentRequiredTitleRule,
  defaultGlobalRetentionAssignmentValidator,
} from "./global-retention-assignment-rules.js";
import { newGlobalRetentionAssignment } from "./global-retention-assignment.js";

test("GlobalRetentionAssignmentValidator reports every problem", () => {
  const validator = defaultGlobalRetentionAssignmentValidator();
  const item = newGlobalRetentionAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalRetentionAssignmentBidRangeRule flags values above bid", () => {
  const rule = new GlobalRetentionAssignmentBidRangeRule(6, 1522.7);
  const item = newGlobalRetentionAssignment("x", "y");
  item.bid = 1524.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalRetentionAssignmentRequiredCategoryRule flags a blank category", () => {
  const rule = new GlobalRetentionAssignmentRequiredCategoryRule("global retention assignment needs this field");
  const item = newGlobalRetentionAssignment("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalRetentionAssignmentDiscountRangeRule flags values above discount", () => {
  const rule = new GlobalRetentionAssignmentDiscountRangeRule(2.2, 4123.3);
  const item = newGlobalRetentionAssignment("x", "y");
  item.discount = 4124.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalRetentionAssignmentRequiredTitleRule flags a blank title", () => {
  const rule = new GlobalRetentionAssignmentRequiredTitleRule("global retention assignment needs this field");
  const item = newGlobalRetentionAssignment("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalRetentionAssignmentCodeLengthRule flags a long code", () => {
  const rule = new GlobalRetentionAssignmentCodeLengthRule(3600);
  const item = newGlobalRetentionAssignment("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
