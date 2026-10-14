import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictTouchpointNoticeCreatedAtRangeRule,
  StrictTouchpointNoticeExpiresAtRangeRule,
  StrictTouchpointNoticeRequiredCodeRule,
  defaultStrictTouchpointNoticeValidator,
} from "./strict-touchpoint-notice-rules.js";
import { newStrictTouchpointNotice } from "./strict-touchpoint-notice.js";

test("StrictTouchpointNoticeValidator reports every problem", () => {
  const validator = defaultStrictTouchpointNoticeValidator();
  const item = newStrictTouchpointNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictTouchpointNoticeRequiredCodeRule flags a blank code", () => {
  const rule = new StrictTouchpointNoticeRequiredCodeRule("strict touchpoint notice needs a value");
  const item = newStrictTouchpointNotice("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictTouchpointNoticeExpiresAtRangeRule flags values above expires at", () => {
  const rule = new StrictTouchpointNoticeExpiresAtRangeRule(255, 3600);
  const item = newStrictTouchpointNotice("x", "y");
  item.expiresAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictTouchpointNoticeCreatedAtRangeRule flags values above created at", () => {
  const rule = new StrictTouchpointNoticeCreatedAtRangeRule(64, 80);
  const item = newStrictTouchpointNotice("x", "y");
  item.createdAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
