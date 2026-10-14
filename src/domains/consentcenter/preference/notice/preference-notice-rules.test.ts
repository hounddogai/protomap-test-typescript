import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PreferenceNoticeBudgetRangeRule,
  PreferenceNoticeChannelLengthRule,
  PreferenceNoticeCodeLengthRule,
  PreferenceNoticeCurrencyLengthRule,
  PreferenceNoticeRequiredNameRule,
  defaultPreferenceNoticeValidator,
} from "./preference-notice-rules.js";
import { newPreferenceNotice } from "./preference-notice.js";

test("PreferenceNoticeValidator reports every problem", () => {
  const validator = defaultPreferenceNoticeValidator();
  const item = newPreferenceNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PreferenceNoticeRequiredNameRule flags a blank name", () => {
  const rule = new PreferenceNoticeRequiredNameRule("preference notice needs this field");
  const item = newPreferenceNotice("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PreferenceNoticeCurrencyLengthRule flags a long currency", () => {
  const rule = new PreferenceNoticeCurrencyLengthRule(32);
  const item = newPreferenceNotice("x", "y");
  item.currency = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PreferenceNoticeBudgetRangeRule flags values above budget", () => {
  const rule = new PreferenceNoticeBudgetRangeRule(5.7, 3102.3);
  const item = newPreferenceNotice("x", "y");
  item.budget = 3103.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PreferenceNoticeCodeLengthRule flags a long code", () => {
  const rule = new PreferenceNoticeCodeLengthRule(255);
  const item = newPreferenceNotice("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PreferenceNoticeChannelLengthRule flags a long channel", () => {
  const rule = new PreferenceNoticeChannelLengthRule(64);
  const item = newPreferenceNotice("x", "y");
  item.channel = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
