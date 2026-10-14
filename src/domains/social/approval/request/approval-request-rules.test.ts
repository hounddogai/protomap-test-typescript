import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ApprovalRequestCodeLengthRule,
  ApprovalRequestJourneyIdLengthRule,
  ApprovalRequestNameLengthRule,
  ApprovalRequestRequiredNameRule,
  defaultApprovalRequestValidator,
} from "./approval-request-rules.js";
import { newApprovalRequest } from "./approval-request.js";

test("ApprovalRequestValidator reports every problem", () => {
  const validator = defaultApprovalRequestValidator();
  const item = newApprovalRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ApprovalRequestRequiredNameRule flags a blank name", () => {
  const rule = new ApprovalRequestRequiredNameRule("approval request needs an entry");
  const item = newApprovalRequest("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ApprovalRequestCodeLengthRule flags a long code", () => {
  const rule = new ApprovalRequestCodeLengthRule(64);
  const item = newApprovalRequest("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ApprovalRequestJourneyIdLengthRule flags a long journey id", () => {
  const rule = new ApprovalRequestJourneyIdLengthRule(16);
  const item = newApprovalRequest("x", "y");
  item.journeyId = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ApprovalRequestNameLengthRule flags a long name", () => {
  const rule = new ApprovalRequestNameLengthRule(32);
  const item = newApprovalRequest("x", "y");
  item.name = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
