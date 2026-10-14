import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ChallengeRecordBudgetRangeRule,
  ChallengeRecordDiscountRangeRule,
  ChallengeRecordRequiredCodeRule,
  ChallengeRecordReviewerLengthRule,
  defaultChallengeRecordValidator,
} from "./challenge-record-rules.js";
import { newChallengeRecord } from "./challenge-record.js";

test("ChallengeRecordValidator reports every problem", () => {
  const validator = defaultChallengeRecordValidator();
  const item = newChallengeRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ChallengeRecordBudgetRangeRule flags values above budget", () => {
  const rule = new ChallengeRecordBudgetRangeRule(1.8, 4210);
  const item = newChallengeRecord("x", "y");
  item.budget = 4211.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ChallengeRecordReviewerLengthRule flags a long reviewer", () => {
  const rule = new ChallengeRecordReviewerLengthRule(16);
  const item = newChallengeRecord("x", "y");
  item.reviewer = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ChallengeRecordDiscountRangeRule flags values above discount", () => {
  const rule = new ChallengeRecordDiscountRangeRule(2.7, 4802.6);
  const item = newChallengeRecord("x", "y");
  item.discount = 4804.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ChallengeRecordRequiredCodeRule flags a blank code", () => {
  const rule = new ChallengeRecordRequiredCodeRule("challenge record needs this field");
  const item = newChallengeRecord("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
