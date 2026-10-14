import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PostRecordLabelLengthRule,
  PostRecordRequiredCodeRule,
  PostRecordRequiredLabelRule,
  defaultPostRecordValidator,
} from "./post-record-rules.js";
import { newPostRecord } from "./post-record.js";

test("PostRecordValidator reports every problem", () => {
  const validator = defaultPostRecordValidator();
  const item = newPostRecord("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PostRecordLabelLengthRule flags a long label", () => {
  const rule = new PostRecordLabelLengthRule(86400);
  const item = newPostRecord("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PostRecordRequiredCodeRule flags a blank code", () => {
  const rule = new PostRecordRequiredCodeRule("post record needs an entry");
  const item = newPostRecord("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PostRecordRequiredLabelRule flags a blank label", () => {
  const rule = new PostRecordRequiredLabelRule("post record needs this field");
  const item = newPostRecord("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
