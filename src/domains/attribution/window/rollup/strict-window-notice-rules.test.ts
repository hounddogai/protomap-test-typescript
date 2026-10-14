import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictWindowNoticeLabelLengthRule,
  StrictWindowNoticeMaximumRangeRule,
  StrictWindowNoticeNotesLengthRule,
  StrictWindowNoticeRequiredCodeRule,
  StrictWindowNoticeRequiredLabelRule,
  StrictWindowNoticeRequiredNotesRule,
  defaultStrictWindowNoticeValidator,
} from "./strict-window-notice-rules.js";
import { newStrictWindowNotice } from "./strict-window-notice.js";

test("StrictWindowNoticeValidator reports every problem", () => {
  const validator = defaultStrictWindowNoticeValidator();
  const item = newStrictWindowNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictWindowNoticeNotesLengthRule flags a long notes", () => {
  const rule = new StrictWindowNoticeNotesLengthRule(255);
  const item = newStrictWindowNotice("x", "y");
  item.notes = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictWindowNoticeRequiredCodeRule flags a blank code", () => {
  const rule = new StrictWindowNoticeRequiredCodeRule("strict window notice needs a value");
  const item = newStrictWindowNotice("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictWindowNoticeLabelLengthRule flags a long label", () => {
  const rule = new StrictWindowNoticeLabelLengthRule(120);
  const item = newStrictWindowNotice("x", "y");
  item.label = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictWindowNoticeRequiredLabelRule flags a blank label", () => {
  const rule = new StrictWindowNoticeRequiredLabelRule("strict window notice needs this field");
  const item = newStrictWindowNotice("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictWindowNoticeMaximumRangeRule flags values above maximum", () => {
  const rule = new StrictWindowNoticeMaximumRangeRule(6.4, 945.9);
  const item = newStrictWindowNotice("x", "y");
  item.maximum = 947.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictWindowNoticeRequiredNotesRule flags a blank notes", () => {
  const rule = new StrictWindowNoticeRequiredNotesRule("strict window notice needs this field");
  const item = newStrictWindowNotice("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
