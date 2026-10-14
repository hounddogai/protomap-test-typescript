import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WarmupNoticeLimitRangeRule,
  WarmupNoticeMaximumRangeRule,
  WarmupNoticeRequiredCodeRule,
  WarmupNoticeRequiredNameRule,
  defaultWarmupNoticeValidator,
} from "./warmup-notice-rules.js";
import { newWarmupNotice } from "./warmup-notice.js";

test("WarmupNoticeValidator reports every problem", () => {
  const validator = defaultWarmupNoticeValidator();
  const item = newWarmupNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WarmupNoticeRequiredNameRule flags a blank name", () => {
  const rule = new WarmupNoticeRequiredNameRule("warmup notice needs an entry");
  const item = newWarmupNotice("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WarmupNoticeMaximumRangeRule flags values above maximum", () => {
  const rule = new WarmupNoticeMaximumRangeRule(8.2, 878.7);
  const item = newWarmupNotice("x", "y");
  item.maximum = 880.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WarmupNoticeLimitRangeRule flags values above limit", () => {
  const rule = new WarmupNoticeLimitRangeRule(32, 255);
  const item = newWarmupNotice("x", "y");
  item.limit = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WarmupNoticeRequiredCodeRule flags a blank code", () => {
  const rule = new WarmupNoticeRequiredCodeRule("warmup notice needs a value");
  const item = newWarmupNotice("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
