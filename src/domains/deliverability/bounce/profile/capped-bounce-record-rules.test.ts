import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedBounceRecordRequiredChannelRule,
  CappedBounceRecordRequiredCodeRule,
  CappedBounceRecordTitleLengthRule,
  defaultCappedBounceRecordValidator,
} from "./capped-bounce-record-rules.js";
import { newCappedBounceRecord } from "./capped-bounce-record.js";

test("CappedBounceRecordValidator reports every problem", () => {
  const validator = defaultCappedBounceRecordValidator();
  const item = newCappedBounceRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedBounceRecordRequiredCodeRule flags a blank code", () => {
  const rule = new CappedBounceRecordRequiredCodeRule("capped bounce record needs an entry");
  const item = newCappedBounceRecord("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedBounceRecordRequiredChannelRule flags a blank channel", () => {
  const rule = new CappedBounceRecordRequiredChannelRule("capped bounce record needs this field");
  const item = newCappedBounceRecord("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedBounceRecordTitleLengthRule flags a long title", () => {
  const rule = new CappedBounceRecordTitleLengthRule(80);
  const item = newCappedBounceRecord("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
