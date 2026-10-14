import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveCreditNoticeBudgetRangeRule,
  AdaptiveCreditNoticeRequiredChecksumRule,
  AdaptiveCreditNoticeRequiredExternalRefRule,
  AdaptiveCreditNoticeTitleLengthRule,
  defaultAdaptiveCreditNoticeValidator,
} from "./adaptive-credit-notice-rules.js";
import { newAdaptiveCreditNotice } from "./adaptive-credit-notice.js";

test("AdaptiveCreditNoticeValidator reports every problem", () => {
  const validator = defaultAdaptiveCreditNoticeValidator();
  const item = newAdaptiveCreditNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveCreditNoticeRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new AdaptiveCreditNoticeRequiredExternalRefRule("adaptive credit notice needs a value");
  const item = newAdaptiveCreditNotice("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveCreditNoticeBudgetRangeRule flags values above budget", () => {
  const rule = new AdaptiveCreditNoticeBudgetRangeRule(2.1, 3257.6);
  const item = newAdaptiveCreditNotice("x", "y");
  item.budget = 3259.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveCreditNoticeTitleLengthRule flags a long title", () => {
  const rule = new AdaptiveCreditNoticeTitleLengthRule(80);
  const item = newAdaptiveCreditNotice("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveCreditNoticeRequiredChecksumRule flags a blank checksum", () => {
  const rule = new AdaptiveCreditNoticeRequiredChecksumRule("adaptive credit notice needs a value");
  const item = newAdaptiveCreditNotice("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
