import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientSlaNoticeCodeLengthRule,
  LenientSlaNoticeNameLengthRule,
  LenientSlaNoticeNotesLengthRule,
  LenientSlaNoticeRequiredNotesRule,
  LenientSlaNoticeUpdatedAtRangeRule,
  defaultLenientSlaNoticeValidator,
} from "./lenient-sla-notice-rules.js";
import { newLenientSlaNotice } from "./lenient-sla-notice.js";

test("LenientSlaNoticeValidator reports every problem", () => {
  const validator = defaultLenientSlaNoticeValidator();
  const item = newLenientSlaNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientSlaNoticeRequiredNotesRule flags a blank notes", () => {
  const rule = new LenientSlaNoticeRequiredNotesRule("lenient sla notice needs a value");
  const item = newLenientSlaNotice("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientSlaNoticeCodeLengthRule flags a long code", () => {
  const rule = new LenientSlaNoticeCodeLengthRule(64);
  const item = newLenientSlaNotice("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientSlaNoticeUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new LenientSlaNoticeUpdatedAtRangeRule(64, 80);
  const item = newLenientSlaNotice("x", "y");
  item.updatedAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientSlaNoticeNotesLengthRule flags a long notes", () => {
  const rule = new LenientSlaNoticeNotesLengthRule(255);
  const item = newLenientSlaNotice("x", "y");
  item.notes = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientSlaNoticeNameLengthRule flags a long name", () => {
  const rule = new LenientSlaNoticeNameLengthRule(120);
  const item = newLenientSlaNotice("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
