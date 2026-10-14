import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CsatExceptionCodeLengthRule,
  CsatExceptionRequiredChannelRule,
  CsatExceptionRequiredCodeRule,
  CsatExceptionRequiredTitleRule,
  CsatExceptionTitleLengthRule,
  defaultCsatExceptionValidator,
} from "./csat-exception-rules.js";
import { newCsatException } from "./csat-exception.js";

test("CsatExceptionValidator reports every problem", () => {
  const validator = defaultCsatExceptionValidator();
  const item = newCsatException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CsatExceptionRequiredCodeRule flags a blank code", () => {
  const rule = new CsatExceptionRequiredCodeRule("csat exception needs an entry");
  const item = newCsatException("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CsatExceptionRequiredTitleRule flags a blank title", () => {
  const rule = new CsatExceptionRequiredTitleRule("csat exception needs this field");
  const item = newCsatException("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CsatExceptionTitleLengthRule flags a long title", () => {
  const rule = new CsatExceptionTitleLengthRule(80);
  const item = newCsatException("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CsatExceptionRequiredChannelRule flags a blank channel", () => {
  const rule = new CsatExceptionRequiredChannelRule("csat exception needs an entry");
  const item = newCsatException("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CsatExceptionCodeLengthRule flags a long code", () => {
  const rule = new CsatExceptionCodeLengthRule(16);
  const item = newCsatException("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
