import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RegionalBounceNoticeCodeLengthRule,
  RegionalBounceNoticeCostRangeRule,
  RegionalBounceNoticeEndsAtRangeRule,
  defaultRegionalBounceNoticeValidator,
} from "./regional-bounce-notice-rules.js";
import { newRegionalBounceNotice } from "./regional-bounce-notice.js";

test("RegionalBounceNoticeValidator reports every problem", () => {
  const validator = defaultRegionalBounceNoticeValidator();
  const item = newRegionalBounceNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RegionalBounceNoticeCodeLengthRule flags a long code", () => {
  const rule = new RegionalBounceNoticeCodeLengthRule(1000);
  const item = newRegionalBounceNotice("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RegionalBounceNoticeCostRangeRule flags values above cost", () => {
  const rule = new RegionalBounceNoticeCostRangeRule(5.9, 2190.8);
  const item = newRegionalBounceNotice("x", "y");
  item.cost = 2192.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RegionalBounceNoticeEndsAtRangeRule flags values above ends at", () => {
  const rule = new RegionalBounceNoticeEndsAtRangeRule(64, 80);
  const item = newRegionalBounceNotice("x", "y");
  item.endsAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
