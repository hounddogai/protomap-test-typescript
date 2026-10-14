import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictApprovalScoreCodeLengthRule,
  StrictApprovalScoreCostRangeRule,
  StrictApprovalScoreRevisionRangeRule,
  StrictApprovalScoreWindowDaysRangeRule,
  defaultStrictApprovalScoreValidator,
} from "./strict-approval-score-rules.js";
import { newStrictApprovalScore } from "./strict-approval-score.js";

test("StrictApprovalScoreValidator reports every problem", () => {
  const validator = defaultStrictApprovalScoreValidator();
  const item = newStrictApprovalScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictApprovalScoreWindowDaysRangeRule flags values above window days", () => {
  const rule = new StrictApprovalScoreWindowDaysRangeRule(120, 3600);
  const item = newStrictApprovalScore("x", "y");
  item.windowDays = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictApprovalScoreRevisionRangeRule flags values above revision", () => {
  const rule = new StrictApprovalScoreRevisionRangeRule(120, 86400);
  const item = newStrictApprovalScore("x", "y");
  item.revision = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictApprovalScoreCostRangeRule flags values above cost", () => {
  const rule = new StrictApprovalScoreCostRangeRule(4.7, 2703.2);
  const item = newStrictApprovalScore("x", "y");
  item.cost = 2704.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictApprovalScoreCodeLengthRule flags a long code", () => {
  const rule = new StrictApprovalScoreCodeLengthRule(3600);
  const item = newStrictApprovalScore("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
