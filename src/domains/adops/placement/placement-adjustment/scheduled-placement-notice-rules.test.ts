import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledPlacementNoticeCodeLengthRule,
  ScheduledPlacementNoticeLabelLengthRule,
  ScheduledPlacementNoticeRequiredCodeRule,
  ScheduledPlacementNoticeRequiredLabelRule,
  ScheduledPlacementNoticeReviewerLengthRule,
  ScheduledPlacementNoticeWeightRangeRule,
  defaultScheduledPlacementNoticeValidator,
} from "./scheduled-placement-notice-rules.js";
import { newScheduledPlacementNotice } from "./scheduled-placement-notice.js";

test("ScheduledPlacementNoticeValidator reports every problem", () => {
  const validator = defaultScheduledPlacementNoticeValidator();
  const item = newScheduledPlacementNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledPlacementNoticeWeightRangeRule flags values above weight", () => {
  const rule = new ScheduledPlacementNoticeWeightRangeRule(0.8, 278.7);
  const item = newScheduledPlacementNotice("x", "y");
  item.weight = 280.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledPlacementNoticeLabelLengthRule flags a long label", () => {
  const rule = new ScheduledPlacementNoticeLabelLengthRule(255);
  const item = newScheduledPlacementNotice("x", "y");
  item.label = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledPlacementNoticeReviewerLengthRule flags a long reviewer", () => {
  const rule = new ScheduledPlacementNoticeReviewerLengthRule(80);
  const item = newScheduledPlacementNotice("x", "y");
  item.reviewer = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledPlacementNoticeCodeLengthRule flags a long code", () => {
  const rule = new ScheduledPlacementNoticeCodeLengthRule(16);
  const item = newScheduledPlacementNotice("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledPlacementNoticeRequiredLabelRule flags a blank label", () => {
  const rule = new ScheduledPlacementNoticeRequiredLabelRule("scheduled placement notice needs an entry");
  const item = newScheduledPlacementNotice("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledPlacementNoticeRequiredCodeRule flags a blank code", () => {
  const rule = new ScheduledPlacementNoticeRequiredCodeRule("scheduled placement notice needs a value");
  const item = newScheduledPlacementNotice("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
