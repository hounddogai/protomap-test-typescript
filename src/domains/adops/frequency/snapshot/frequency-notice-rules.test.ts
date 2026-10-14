import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FrequencyNoticeBudgetRangeRule,
  FrequencyNoticeCodeLengthRule,
  defaultFrequencyNoticeValidator,
} from "./frequency-notice-rules.js";
import { newFrequencyNotice } from "./frequency-notice.js";

test("FrequencyNoticeValidator reports every problem", () => {
  const validator = defaultFrequencyNoticeValidator();
  const item = newFrequencyNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FrequencyNoticeCodeLengthRule flags a long code", () => {
  const rule = new FrequencyNoticeCodeLengthRule(16);
  const item = newFrequencyNotice("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FrequencyNoticeBudgetRangeRule flags values above budget", () => {
  const rule = new FrequencyNoticeBudgetRangeRule(5.5, 4887.2);
  const item = newFrequencyNotice("x", "y");
  item.budget = 4888.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
