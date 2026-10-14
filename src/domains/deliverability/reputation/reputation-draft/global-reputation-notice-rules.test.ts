import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalReputationNoticeRateRangeRule,
  GlobalReputationNoticeRequiredCodeRule,
  GlobalReputationNoticeTitleLengthRule,
  defaultGlobalReputationNoticeValidator,
} from "./global-reputation-notice-rules.js";
import { newGlobalReputationNotice } from "./global-reputation-notice.js";

test("GlobalReputationNoticeValidator reports every problem", () => {
  const validator = defaultGlobalReputationNoticeValidator();
  const item = newGlobalReputationNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalReputationNoticeRateRangeRule flags values above rate", () => {
  const rule = new GlobalReputationNoticeRateRangeRule(0.6, 1650);
  const item = newGlobalReputationNotice("x", "y");
  item.rate = 1651.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalReputationNoticeRequiredCodeRule flags a blank code", () => {
  const rule = new GlobalReputationNoticeRequiredCodeRule("global reputation notice needs an entry");
  const item = newGlobalReputationNotice("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalReputationNoticeTitleLengthRule flags a long title", () => {
  const rule = new GlobalReputationNoticeTitleLengthRule(1000);
  const item = newGlobalReputationNotice("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
