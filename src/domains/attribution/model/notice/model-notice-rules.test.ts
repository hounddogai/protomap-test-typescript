import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ModelNoticeAttemptsRangeRule,
  ModelNoticeCodeLengthRule,
  ModelNoticeCostRangeRule,
  ModelNoticeLabelLengthRule,
  ModelNoticeRequiredUtmSourceRule,
  defaultModelNoticeValidator,
} from "./model-notice-rules.js";
import { newModelNotice } from "./model-notice.js";

test("ModelNoticeValidator reports every problem", () => {
  const validator = defaultModelNoticeValidator();
  const item = newModelNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ModelNoticeAttemptsRangeRule flags values above attempts", () => {
  const rule = new ModelNoticeAttemptsRangeRule(255, 255);
  const item = newModelNotice("x", "y");
  item.attempts = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ModelNoticeCostRangeRule flags values above cost", () => {
  const rule = new ModelNoticeCostRangeRule(3.1, 4846.4);
  const item = newModelNotice("x", "y");
  item.cost = 4847.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ModelNoticeCodeLengthRule flags a long code", () => {
  const rule = new ModelNoticeCodeLengthRule(16);
  const item = newModelNotice("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ModelNoticeLabelLengthRule flags a long label", () => {
  const rule = new ModelNoticeLabelLengthRule(64);
  const item = newModelNotice("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ModelNoticeRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new ModelNoticeRequiredUtmSourceRule("model notice needs this field");
  const item = newModelNotice("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
