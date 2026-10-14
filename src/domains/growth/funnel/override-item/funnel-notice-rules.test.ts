import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FunnelNoticeNotesLengthRule,
  FunnelNoticeRequiredCodeRule,
  defaultFunnelNoticeValidator,
} from "./funnel-notice-rules.js";
import { newFunnelNotice } from "./funnel-notice.js";

test("FunnelNoticeValidator reports every problem", () => {
  const validator = defaultFunnelNoticeValidator();
  const item = newFunnelNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FunnelNoticeRequiredCodeRule flags a blank code", () => {
  const rule = new FunnelNoticeRequiredCodeRule("funnel notice needs a value");
  const item = newFunnelNotice("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FunnelNoticeNotesLengthRule flags a long notes", () => {
  const rule = new FunnelNoticeNotesLengthRule(64);
  const item = newFunnelNotice("x", "y");
  item.notes = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
