import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredInsightAssignmentCodeLengthRule,
  TieredInsightAssignmentRequiredTitleRule,
  TieredInsightAssignmentSourceLengthRule,
  TieredInsightAssignmentTitleLengthRule,
  defaultTieredInsightAssignmentValidator,
} from "./tiered-insight-assignment-rules.js";
import { newTieredInsightAssignment } from "./tiered-insight-assignment.js";

test("TieredInsightAssignmentValidator reports every problem", () => {
  const validator = defaultTieredInsightAssignmentValidator();
  const item = newTieredInsightAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredInsightAssignmentRequiredTitleRule flags a blank title", () => {
  const rule = new TieredInsightAssignmentRequiredTitleRule("tiered insight assignment needs a value");
  const item = newTieredInsightAssignment("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredInsightAssignmentSourceLengthRule flags a long source", () => {
  const rule = new TieredInsightAssignmentSourceLengthRule(3600);
  const item = newTieredInsightAssignment("x", "y");
  item.source = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredInsightAssignmentCodeLengthRule flags a long code", () => {
  const rule = new TieredInsightAssignmentCodeLengthRule(120);
  const item = newTieredInsightAssignment("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredInsightAssignmentTitleLengthRule flags a long title", () => {
  const rule = new TieredInsightAssignmentTitleLengthRule(80);
  const item = newTieredInsightAssignment("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
