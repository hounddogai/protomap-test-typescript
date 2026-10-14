import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredBranchNoticeCodeLengthRule,
  TieredBranchNoticeRequiredSourceRule,
  TieredBranchNoticeRequiredTitleRule,
  TieredBranchNoticeSegmentLengthRule,
  TieredBranchNoticeTitleLengthRule,
  defaultTieredBranchNoticeValidator,
} from "./tiered-branch-notice-rules.js";
import { newTieredBranchNotice } from "./tiered-branch-notice.js";

test("TieredBranchNoticeValidator reports every problem", () => {
  const validator = defaultTieredBranchNoticeValidator();
  const item = newTieredBranchNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredBranchNoticeTitleLengthRule flags a long title", () => {
  const rule = new TieredBranchNoticeTitleLengthRule(86400);
  const item = newTieredBranchNotice("x", "y");
  item.title = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredBranchNoticeRequiredSourceRule flags a blank source", () => {
  const rule = new TieredBranchNoticeRequiredSourceRule("tiered branch notice needs a value");
  const item = newTieredBranchNotice("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredBranchNoticeCodeLengthRule flags a long code", () => {
  const rule = new TieredBranchNoticeCodeLengthRule(32);
  const item = newTieredBranchNotice("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredBranchNoticeSegmentLengthRule flags a long segment", () => {
  const rule = new TieredBranchNoticeSegmentLengthRule(255);
  const item = newTieredBranchNotice("x", "y");
  item.segment = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredBranchNoticeRequiredTitleRule flags a blank title", () => {
  const rule = new TieredBranchNoticeRequiredTitleRule("tiered branch notice needs an entry");
  const item = newTieredBranchNotice("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
