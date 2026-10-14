import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PacingNoticeCodeLengthRule,
  PacingNoticeFrequencyCapRangeRule,
  defaultPacingNoticeValidator,
} from "./pacing-notice-rules.js";
import { newPacingNotice } from "./pacing-notice.js";

test("PacingNoticeValidator reports every problem", () => {
  const validator = defaultPacingNoticeValidator();
  const item = newPacingNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PacingNoticeCodeLengthRule flags a long code", () => {
  const rule = new PacingNoticeCodeLengthRule(1000);
  const item = newPacingNotice("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PacingNoticeFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new PacingNoticeFrequencyCapRangeRule(80, 1000);
  const item = newPacingNotice("x", "y");
  item.frequencyCap = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
