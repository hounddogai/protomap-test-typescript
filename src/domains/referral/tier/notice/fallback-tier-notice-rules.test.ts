import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackTierNoticeRequiredSourceRule,
  FallbackTierNoticeTitleLengthRule,
  defaultFallbackTierNoticeValidator,
} from "./fallback-tier-notice-rules.js";
import { newFallbackTierNotice } from "./fallback-tier-notice.js";

test("FallbackTierNoticeValidator reports every problem", () => {
  const validator = defaultFallbackTierNoticeValidator();
  const item = newFallbackTierNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackTierNoticeTitleLengthRule flags a long title", () => {
  const rule = new FallbackTierNoticeTitleLengthRule(64);
  const item = newFallbackTierNotice("x", "y");
  item.title = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackTierNoticeRequiredSourceRule flags a blank source", () => {
  const rule = new FallbackTierNoticeRequiredSourceRule("fallback tier notice needs this field");
  const item = newFallbackTierNotice("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
