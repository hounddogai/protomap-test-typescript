import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InviteThresholdRatioRangeRule,
  InviteThresholdRequiredCodeRule,
  InviteThresholdRequiredTitleRule,
  InviteThresholdTitleLengthRule,
  defaultInviteThresholdValidator,
} from "./invite-threshold-rules.js";
import { newInviteThreshold } from "./invite-threshold.js";

test("InviteThresholdValidator reports every problem", () => {
  const validator = defaultInviteThresholdValidator();
  const item = newInviteThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("InviteThresholdRequiredTitleRule flags a blank title", () => {
  const rule = new InviteThresholdRequiredTitleRule("invite threshold needs an entry");
  const item = newInviteThreshold("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InviteThresholdRatioRangeRule flags values above ratio", () => {
  const rule = new InviteThresholdRatioRangeRule(2, 4314.6);
  const item = newInviteThreshold("x", "y");
  item.ratio = 4316.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("InviteThresholdRequiredCodeRule flags a blank code", () => {
  const rule = new InviteThresholdRequiredCodeRule("invite threshold needs a value");
  const item = newInviteThreshold("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InviteThresholdTitleLengthRule flags a long title", () => {
  const rule = new InviteThresholdTitleLengthRule(32);
  const item = newInviteThreshold("x", "y");
  item.title = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
