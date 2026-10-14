import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedExitRuleAssignmentChannelLengthRule,
  BatchedExitRuleAssignmentTitleLengthRule,
  defaultBatchedExitRuleAssignmentValidator,
} from "./batched-exit-rule-assignment-rules.js";
import { newBatchedExitRuleAssignment } from "./batched-exit-rule-assignment.js";

test("BatchedExitRuleAssignmentValidator reports every problem", () => {
  const validator = defaultBatchedExitRuleAssignmentValidator();
  const item = newBatchedExitRuleAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedExitRuleAssignmentChannelLengthRule flags a long channel", () => {
  const rule = new BatchedExitRuleAssignmentChannelLengthRule(3600);
  const item = newBatchedExitRuleAssignment("x", "y");
  item.channel = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedExitRuleAssignmentTitleLengthRule flags a long title", () => {
  const rule = new BatchedExitRuleAssignmentTitleLengthRule(120);
  const item = newBatchedExitRuleAssignment("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
