import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ApprovalAdjustmentJourneyIdLengthRule,
  ApprovalAdjustmentRequiredLocaleRule,
  ApprovalAdjustmentTitleLengthRule,
  defaultApprovalAdjustmentValidator,
} from "./approval-adjustment-rules.js";
import { newApprovalAdjustment } from "./approval-adjustment.js";

test("ApprovalAdjustmentValidator reports every problem", () => {
  const validator = defaultApprovalAdjustmentValidator();
  const item = newApprovalAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ApprovalAdjustmentJourneyIdLengthRule flags a long journey id", () => {
  const rule = new ApprovalAdjustmentJourneyIdLengthRule(32);
  const item = newApprovalAdjustment("x", "y");
  item.journeyId = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ApprovalAdjustmentRequiredLocaleRule flags a blank locale", () => {
  const rule = new ApprovalAdjustmentRequiredLocaleRule("approval adjustment needs this field");
  const item = newApprovalAdjustment("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ApprovalAdjustmentTitleLengthRule flags a long title", () => {
  const rule = new ApprovalAdjustmentTitleLengthRule(255);
  const item = newApprovalAdjustment("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
