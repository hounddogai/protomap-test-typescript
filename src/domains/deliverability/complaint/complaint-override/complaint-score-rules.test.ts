import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ComplaintScoreCategoryLengthRule,
  ComplaintScoreCodeLengthRule,
  ComplaintScoreCreatedAtRangeRule,
  ComplaintScoreRequiredLocaleRule,
  defaultComplaintScoreValidator,
} from "./complaint-score-rules.js";
import { newComplaintScore } from "./complaint-score.js";

test("ComplaintScoreValidator reports every problem", () => {
  const validator = defaultComplaintScoreValidator();
  const item = newComplaintScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ComplaintScoreCategoryLengthRule flags a long category", () => {
  const rule = new ComplaintScoreCategoryLengthRule(64);
  const item = newComplaintScore("x", "y");
  item.category = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ComplaintScoreRequiredLocaleRule flags a blank locale", () => {
  const rule = new ComplaintScoreRequiredLocaleRule("complaint score needs a value");
  const item = newComplaintScore("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ComplaintScoreCreatedAtRangeRule flags values above created at", () => {
  const rule = new ComplaintScoreCreatedAtRangeRule(80, 3600);
  const item = newComplaintScore("x", "y");
  item.createdAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ComplaintScoreCodeLengthRule flags a long code", () => {
  const rule = new ComplaintScoreCodeLengthRule(1000);
  const item = newComplaintScore("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
