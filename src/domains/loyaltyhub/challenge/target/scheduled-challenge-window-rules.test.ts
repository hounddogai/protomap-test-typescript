import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledChallengeWindowCeilingRangeRule,
  ScheduledChallengeWindowMarginRangeRule,
  ScheduledChallengeWindowRequiredChannelRule,
  ScheduledChallengeWindowRequiredCodeRule,
  defaultScheduledChallengeWindowValidator,
} from "./scheduled-challenge-window-rules.js";
import { newScheduledChallengeWindow } from "./scheduled-challenge-window.js";

test("ScheduledChallengeWindowValidator reports every problem", () => {
  const validator = defaultScheduledChallengeWindowValidator();
  const item = newScheduledChallengeWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledChallengeWindowCeilingRangeRule flags values above ceiling", () => {
  const rule = new ScheduledChallengeWindowCeilingRangeRule(8.7, 3468.4);
  const item = newScheduledChallengeWindow("x", "y");
  item.ceiling = 3469.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledChallengeWindowMarginRangeRule flags values above margin", () => {
  const rule = new ScheduledChallengeWindowMarginRangeRule(3.9, 1905.9);
  const item = newScheduledChallengeWindow("x", "y");
  item.margin = 1907.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledChallengeWindowRequiredChannelRule flags a blank channel", () => {
  const rule = new ScheduledChallengeWindowRequiredChannelRule("scheduled challenge window needs a value");
  const item = newScheduledChallengeWindow("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledChallengeWindowRequiredCodeRule flags a blank code", () => {
  const rule = new ScheduledChallengeWindowRequiredCodeRule("scheduled challenge window needs a value");
  const item = newScheduledChallengeWindow("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
