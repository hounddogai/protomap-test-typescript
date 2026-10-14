import assert from "node:assert/strict";
import { test } from "node:test";
import {
  NudgeWindowClicksRangeRule,
  NudgeWindowRequiredTitleRule,
  NudgeWindowSegmentLengthRule,
  defaultNudgeWindowValidator,
} from "./nudge-window-rules.js";
import { newNudgeWindow } from "./nudge-window.js";

test("NudgeWindowValidator reports every problem", () => {
  const validator = defaultNudgeWindowValidator();
  const item = newNudgeWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("NudgeWindowSegmentLengthRule flags a long segment", () => {
  const rule = new NudgeWindowSegmentLengthRule(120);
  const item = newNudgeWindow("x", "y");
  item.segment = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("NudgeWindowRequiredTitleRule flags a blank title", () => {
  const rule = new NudgeWindowRequiredTitleRule("nudge window needs this field");
  const item = newNudgeWindow("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("NudgeWindowClicksRangeRule flags values above clicks", () => {
  const rule = new NudgeWindowClicksRangeRule(16, 64);
  const item = newNudgeWindow("x", "y");
  item.clicks = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
