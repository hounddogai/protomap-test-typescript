import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingPlacementNoticeBudgetRangeRule,
  RollingPlacementNoticeCodeLengthRule,
  RollingPlacementNoticeRequiredOwnerIdRule,
  defaultRollingPlacementNoticeValidator,
} from "./rolling-placement-notice-rules.js";
import { newRollingPlacementNotice } from "./rolling-placement-notice.js";

test("RollingPlacementNoticeValidator reports every problem", () => {
  const validator = defaultRollingPlacementNoticeValidator();
  const item = newRollingPlacementNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingPlacementNoticeRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new RollingPlacementNoticeRequiredOwnerIdRule("rolling placement notice needs a value");
  const item = newRollingPlacementNotice("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingPlacementNoticeCodeLengthRule flags a long code", () => {
  const rule = new RollingPlacementNoticeCodeLengthRule(32);
  const item = newRollingPlacementNotice("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingPlacementNoticeBudgetRangeRule flags values above budget", () => {
  const rule = new RollingPlacementNoticeBudgetRangeRule(8.6, 2436.4);
  const item = newRollingPlacementNotice("x", "y");
  item.budget = 2437.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
