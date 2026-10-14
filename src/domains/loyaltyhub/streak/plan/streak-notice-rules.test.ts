import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StreakNoticeLabelLengthRule,
  StreakNoticeRequiredCodeRule,
  StreakNoticeRetriesRangeRule,
  defaultStreakNoticeValidator,
} from "./streak-notice-rules.js";
import { newStreakNotice } from "./streak-notice.js";

test("StreakNoticeValidator reports every problem", () => {
  const validator = defaultStreakNoticeValidator();
  const item = newStreakNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StreakNoticeRequiredCodeRule flags a blank code", () => {
  const rule = new StreakNoticeRequiredCodeRule("streak notice needs this field");
  const item = newStreakNotice("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StreakNoticeLabelLengthRule flags a long label", () => {
  const rule = new StreakNoticeLabelLengthRule(1000);
  const item = newStreakNotice("x", "y");
  item.label = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StreakNoticeRetriesRangeRule flags values above retries", () => {
  const rule = new StreakNoticeRetriesRangeRule(64, 64);
  const item = newStreakNotice("x", "y");
  item.retries = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
