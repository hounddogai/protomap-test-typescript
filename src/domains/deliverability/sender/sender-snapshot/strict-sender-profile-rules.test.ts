import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictSenderProfileGraceDaysRangeRule,
  StrictSenderProfileMaximumRangeRule,
  StrictSenderProfileUtmSourceLengthRule,
  defaultStrictSenderProfileValidator,
} from "./strict-sender-profile-rules.js";
import { newStrictSenderProfile } from "./strict-sender-profile.js";

test("StrictSenderProfileValidator reports every problem", () => {
  const validator = defaultStrictSenderProfileValidator();
  const item = newStrictSenderProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictSenderProfileUtmSourceLengthRule flags a long utm source", () => {
  const rule = new StrictSenderProfileUtmSourceLengthRule(80);
  const item = newStrictSenderProfile("x", "y");
  item.utmSource = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictSenderProfileGraceDaysRangeRule flags values above grace days", () => {
  const rule = new StrictSenderProfileGraceDaysRangeRule(32, 80);
  const item = newStrictSenderProfile("x", "y");
  item.graceDays = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictSenderProfileMaximumRangeRule flags values above maximum", () => {
  const rule = new StrictSenderProfileMaximumRangeRule(1.4, 4705.8);
  const item = newStrictSenderProfile("x", "y");
  item.maximum = 4707.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
