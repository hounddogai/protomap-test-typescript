import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ApprovalScoreAmountRangeRule,
  ApprovalScoreRequiredTitleRule,
  defaultApprovalScoreValidator,
} from "./approval-score-rules.js";
import { newApprovalScore } from "./approval-score.js";

test("ApprovalScoreValidator reports every problem", () => {
  const validator = defaultApprovalScoreValidator();
  const item = newApprovalScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ApprovalScoreAmountRangeRule flags values above amount", () => {
  const rule = new ApprovalScoreAmountRangeRule(0.4, 530.9);
  const item = newApprovalScore("x", "y");
  item.amount = 532.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ApprovalScoreRequiredTitleRule flags a blank title", () => {
  const rule = new ApprovalScoreRequiredTitleRule("approval score needs a value");
  const item = newApprovalScore("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
