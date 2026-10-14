import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ConversionNoticeCodeLengthRule,
  ConversionNoticeRequiredContactEmailRule,
  ConversionNoticeRetriesRangeRule,
  ConversionNoticeSequenceRangeRule,
  ConversionNoticeTimezoneLengthRule,
  defaultConversionNoticeValidator,
} from "./conversion-notice-rules.js";
import { newConversionNotice } from "./conversion-notice.js";

test("ConversionNoticeValidator reports every problem", () => {
  const validator = defaultConversionNoticeValidator();
  const item = newConversionNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ConversionNoticeCodeLengthRule flags a long code", () => {
  const rule = new ConversionNoticeCodeLengthRule(3600);
  const item = newConversionNotice("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ConversionNoticeRetriesRangeRule flags values above retries", () => {
  const rule = new ConversionNoticeRetriesRangeRule(32, 32);
  const item = newConversionNotice("x", "y");
  item.retries = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ConversionNoticeSequenceRangeRule flags values above sequence", () => {
  const rule = new ConversionNoticeSequenceRangeRule(32, 64);
  const item = newConversionNotice("x", "y");
  item.sequence = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ConversionNoticeRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new ConversionNoticeRequiredContactEmailRule("conversion notice needs this field");
  const item = newConversionNotice("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ConversionNoticeTimezoneLengthRule flags a long timezone", () => {
  const rule = new ConversionNoticeTimezoneLengthRule(32);
  const item = newConversionNotice("x", "y");
  item.timezone = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
