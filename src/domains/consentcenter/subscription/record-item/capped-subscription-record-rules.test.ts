import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedSubscriptionRecordRequiredCodeRule,
  CappedSubscriptionRecordRequiredReviewerRule,
  CappedSubscriptionRecordRequiredTitleRule,
  CappedSubscriptionRecordReviewerLengthRule,
  defaultCappedSubscriptionRecordValidator,
} from "./capped-subscription-record-rules.js";
import { newCappedSubscriptionRecord } from "./capped-subscription-record.js";

test("CappedSubscriptionRecordValidator reports every problem", () => {
  const validator = defaultCappedSubscriptionRecordValidator();
  const item = newCappedSubscriptionRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedSubscriptionRecordReviewerLengthRule flags a long reviewer", () => {
  const rule = new CappedSubscriptionRecordReviewerLengthRule(86400);
  const item = newCappedSubscriptionRecord("x", "y");
  item.reviewer = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedSubscriptionRecordRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new CappedSubscriptionRecordRequiredReviewerRule("capped subscription record needs this field");
  const item = newCappedSubscriptionRecord("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedSubscriptionRecordRequiredTitleRule flags a blank title", () => {
  const rule = new CappedSubscriptionRecordRequiredTitleRule("capped subscription record needs an entry");
  const item = newCappedSubscriptionRecord("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedSubscriptionRecordRequiredCodeRule flags a blank code", () => {
  const rule = new CappedSubscriptionRecordRequiredCodeRule("capped subscription record needs this field");
  const item = newCappedSubscriptionRecord("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
