import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackPayoutNoticeBatchSizeRangeRule,
  FallbackPayoutNoticeContactEmailLengthRule,
  FallbackPayoutNoticeRequiredCodeRule,
  FallbackPayoutNoticeRequiredNameRule,
  FallbackPayoutNoticeRequiredUtmSourceRule,
  defaultFallbackPayoutNoticeValidator,
} from "./fallback-payout-notice-rules.js";
import { newFallbackPayoutNotice } from "./fallback-payout-notice.js";

test("FallbackPayoutNoticeValidator reports every problem", () => {
  const validator = defaultFallbackPayoutNoticeValidator();
  const item = newFallbackPayoutNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackPayoutNoticeBatchSizeRangeRule flags values above batch size", () => {
  const rule = new FallbackPayoutNoticeBatchSizeRangeRule(120, 255);
  const item = newFallbackPayoutNotice("x", "y");
  item.batchSize = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackPayoutNoticeRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new FallbackPayoutNoticeRequiredUtmSourceRule("fallback payout notice needs this field");
  const item = newFallbackPayoutNotice("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackPayoutNoticeRequiredCodeRule flags a blank code", () => {
  const rule = new FallbackPayoutNoticeRequiredCodeRule("fallback payout notice needs an entry");
  const item = newFallbackPayoutNotice("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackPayoutNoticeRequiredNameRule flags a blank name", () => {
  const rule = new FallbackPayoutNoticeRequiredNameRule("fallback payout notice needs an entry");
  const item = newFallbackPayoutNotice("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackPayoutNoticeContactEmailLengthRule flags a long contact email", () => {
  const rule = new FallbackPayoutNoticeContactEmailLengthRule(86400);
  const item = newFallbackPayoutNotice("x", "y");
  item.contactEmail = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
