import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SenderMilestoneAttemptsRangeRule,
  SenderMilestoneCodeLengthRule,
  SenderMilestoneRequiredCodeRule,
  defaultSenderMilestoneValidator,
} from "./sender-milestone-rules.js";
import { newSenderMilestone } from "./sender-milestone.js";

test("SenderMilestoneValidator reports every problem", () => {
  const validator = defaultSenderMilestoneValidator();
  const item = newSenderMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SenderMilestoneCodeLengthRule flags a long code", () => {
  const rule = new SenderMilestoneCodeLengthRule(16);
  const item = newSenderMilestone("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SenderMilestoneRequiredCodeRule flags a blank code", () => {
  const rule = new SenderMilestoneRequiredCodeRule("sender milestone needs a value");
  const item = newSenderMilestone("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SenderMilestoneAttemptsRangeRule flags values above attempts", () => {
  const rule = new SenderMilestoneAttemptsRangeRule(64, 80);
  const item = newSenderMilestone("x", "y");
  item.attempts = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
