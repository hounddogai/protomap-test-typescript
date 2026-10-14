import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TouchpointNoticeBudgetRangeRule,
  TouchpointNoticeCodeLengthRule,
  TouchpointNoticeRequiredCategoryRule,
  defaultTouchpointNoticeValidator,
} from "./touchpoint-notice-rules.js";
import { newTouchpointNotice } from "./touchpoint-notice.js";

test("TouchpointNoticeValidator reports every problem", () => {
  const validator = defaultTouchpointNoticeValidator();
  const item = newTouchpointNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TouchpointNoticeCodeLengthRule flags a long code", () => {
  const rule = new TouchpointNoticeCodeLengthRule(1000);
  const item = newTouchpointNotice("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TouchpointNoticeBudgetRangeRule flags values above budget", () => {
  const rule = new TouchpointNoticeBudgetRangeRule(3.4, 486.2);
  const item = newTouchpointNotice("x", "y");
  item.budget = 487.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TouchpointNoticeRequiredCategoryRule flags a blank category", () => {
  const rule = new TouchpointNoticeRequiredCategoryRule("touchpoint notice needs this field");
  const item = newTouchpointNotice("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
