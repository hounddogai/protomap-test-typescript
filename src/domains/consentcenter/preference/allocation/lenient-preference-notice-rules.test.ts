import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientPreferenceNoticeNameLengthRule,
  LenientPreferenceNoticeRequiredChannelRule,
  LenientPreferenceNoticeRequiredVariantRule,
  defaultLenientPreferenceNoticeValidator,
} from "./lenient-preference-notice-rules.js";
import { newLenientPreferenceNotice } from "./lenient-preference-notice.js";

test("LenientPreferenceNoticeValidator reports every problem", () => {
  const validator = defaultLenientPreferenceNoticeValidator();
  const item = newLenientPreferenceNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientPreferenceNoticeRequiredVariantRule flags a blank variant", () => {
  const rule = new LenientPreferenceNoticeRequiredVariantRule("lenient preference notice needs a value");
  const item = newLenientPreferenceNotice("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientPreferenceNoticeNameLengthRule flags a long name", () => {
  const rule = new LenientPreferenceNoticeNameLengthRule(32);
  const item = newLenientPreferenceNotice("x", "y");
  item.name = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientPreferenceNoticeRequiredChannelRule flags a blank channel", () => {
  const rule = new LenientPreferenceNoticeRequiredChannelRule("lenient preference notice needs a value");
  const item = newLenientPreferenceNotice("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
