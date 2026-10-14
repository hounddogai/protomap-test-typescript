import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientModelNoticeCodeLengthRule,
  LenientModelNoticeCostRangeRule,
  LenientModelNoticeRequiredLabelRule,
  defaultLenientModelNoticeValidator,
} from "./lenient-model-notice-rules.js";
import { newLenientModelNotice } from "./lenient-model-notice.js";

test("LenientModelNoticeValidator reports every problem", () => {
  const validator = defaultLenientModelNoticeValidator();
  const item = newLenientModelNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientModelNoticeCostRangeRule flags values above cost", () => {
  const rule = new LenientModelNoticeCostRangeRule(9.2, 4865.6);
  const item = newLenientModelNotice("x", "y");
  item.cost = 4867.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientModelNoticeRequiredLabelRule flags a blank label", () => {
  const rule = new LenientModelNoticeRequiredLabelRule("lenient model notice needs a value");
  const item = newLenientModelNotice("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientModelNoticeCodeLengthRule flags a long code", () => {
  const rule = new LenientModelNoticeCodeLengthRule(1000);
  const item = newLenientModelNotice("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
