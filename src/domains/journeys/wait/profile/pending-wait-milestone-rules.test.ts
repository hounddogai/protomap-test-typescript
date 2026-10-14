import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingWaitMilestoneClicksRangeRule,
  PendingWaitMilestoneCodeLengthRule,
  PendingWaitMilestoneLocaleLengthRule,
  PendingWaitMilestoneRequiredCodeRule,
  defaultPendingWaitMilestoneValidator,
} from "./pending-wait-milestone-rules.js";
import { newPendingWaitMilestone } from "./pending-wait-milestone.js";

test("PendingWaitMilestoneValidator reports every problem", () => {
  const validator = defaultPendingWaitMilestoneValidator();
  const item = newPendingWaitMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingWaitMilestoneClicksRangeRule flags values above clicks", () => {
  const rule = new PendingWaitMilestoneClicksRangeRule(64, 80);
  const item = newPendingWaitMilestone("x", "y");
  item.clicks = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingWaitMilestoneCodeLengthRule flags a long code", () => {
  const rule = new PendingWaitMilestoneCodeLengthRule(1000);
  const item = newPendingWaitMilestone("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingWaitMilestoneLocaleLengthRule flags a long locale", () => {
  const rule = new PendingWaitMilestoneLocaleLengthRule(64);
  const item = newPendingWaitMilestone("x", "y");
  item.locale = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingWaitMilestoneRequiredCodeRule flags a blank code", () => {
  const rule = new PendingWaitMilestoneRequiredCodeRule("pending wait milestone needs this field");
  const item = newPendingWaitMilestone("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
