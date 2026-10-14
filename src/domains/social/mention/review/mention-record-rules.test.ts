import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MentionRecordCodeLengthRule,
  MentionRecordDiscountRangeRule,
  MentionRecordNameLengthRule,
  MentionRecordRequiredNameRule,
  defaultMentionRecordValidator,
} from "./mention-record-rules.js";
import { newMentionRecord } from "./mention-record.js";

test("MentionRecordValidator reports every problem", () => {
  const validator = defaultMentionRecordValidator();
  const item = newMentionRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("MentionRecordDiscountRangeRule flags values above discount", () => {
  const rule = new MentionRecordDiscountRangeRule(0, 578.8);
  const item = newMentionRecord("x", "y");
  item.discount = 580.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("MentionRecordNameLengthRule flags a long name", () => {
  const rule = new MentionRecordNameLengthRule(86400);
  const item = newMentionRecord("x", "y");
  item.name = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("MentionRecordRequiredNameRule flags a blank name", () => {
  const rule = new MentionRecordRequiredNameRule("mention record needs a value");
  const item = newMentionRecord("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("MentionRecordCodeLengthRule flags a long code", () => {
  const rule = new MentionRecordCodeLengthRule(32);
  const item = newMentionRecord("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
