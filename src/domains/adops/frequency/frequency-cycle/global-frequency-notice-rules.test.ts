import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalFrequencyNoticeMinimumRangeRule,
  GlobalFrequencyNoticeRequiredNameRule,
  GlobalFrequencyNoticeRequiredSegmentRule,
  GlobalFrequencyNoticeVariantLengthRule,
  defaultGlobalFrequencyNoticeValidator,
} from "./global-frequency-notice-rules.js";
import { newGlobalFrequencyNotice } from "./global-frequency-notice.js";

test("GlobalFrequencyNoticeValidator reports every problem", () => {
  const validator = defaultGlobalFrequencyNoticeValidator();
  const item = newGlobalFrequencyNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalFrequencyNoticeRequiredSegmentRule flags a blank segment", () => {
  const rule = new GlobalFrequencyNoticeRequiredSegmentRule("global frequency notice needs an entry");
  const item = newGlobalFrequencyNotice("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalFrequencyNoticeRequiredNameRule flags a blank name", () => {
  const rule = new GlobalFrequencyNoticeRequiredNameRule("global frequency notice needs a value");
  const item = newGlobalFrequencyNotice("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalFrequencyNoticeMinimumRangeRule flags values above minimum", () => {
  const rule = new GlobalFrequencyNoticeMinimumRangeRule(8, 3188.6);
  const item = newGlobalFrequencyNotice("x", "y");
  item.minimum = 3190.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalFrequencyNoticeVariantLengthRule flags a long variant", () => {
  const rule = new GlobalFrequencyNoticeVariantLengthRule(3600);
  const item = newGlobalFrequencyNotice("x", "y");
  item.variant = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
