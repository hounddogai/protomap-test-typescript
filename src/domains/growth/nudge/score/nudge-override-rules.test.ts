import assert from "node:assert/strict";
import { test } from "node:test";
import {
  NudgeOverrideGraceDaysRangeRule,
  NudgeOverrideRequiredCodeRule,
  NudgeOverrideSendAtRangeRule,
  NudgeOverrideTitleLengthRule,
  defaultNudgeOverrideValidator,
} from "./nudge-override-rules.js";
import { newNudgeOverride } from "./nudge-override.js";

test("NudgeOverrideValidator reports every problem", () => {
  const validator = defaultNudgeOverrideValidator();
  const item = newNudgeOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("NudgeOverrideSendAtRangeRule flags values above send at", () => {
  const rule = new NudgeOverrideSendAtRangeRule(64, 86400);
  const item = newNudgeOverride("x", "y");
  item.sendAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("NudgeOverrideTitleLengthRule flags a long title", () => {
  const rule = new NudgeOverrideTitleLengthRule(255);
  const item = newNudgeOverride("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("NudgeOverrideGraceDaysRangeRule flags values above grace days", () => {
  const rule = new NudgeOverrideGraceDaysRangeRule(80, 86400);
  const item = newNudgeOverride("x", "y");
  item.graceDays = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("NudgeOverrideRequiredCodeRule flags a blank code", () => {
  const rule = new NudgeOverrideRequiredCodeRule("nudge override needs a value");
  const item = newNudgeOverride("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
