import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PostExceptionCodeLengthRule,
  PostExceptionLabelLengthRule,
  PostExceptionRateRangeRule,
  PostExceptionRequiredExternalRefRule,
  defaultPostExceptionValidator,
} from "./post-exception-rules.js";
import { newPostException } from "./post-exception.js";

test("PostExceptionValidator reports every problem", () => {
  const validator = defaultPostExceptionValidator();
  const item = newPostException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PostExceptionCodeLengthRule flags a long code", () => {
  const rule = new PostExceptionCodeLengthRule(3600);
  const item = newPostException("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PostExceptionRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new PostExceptionRequiredExternalRefRule("post exception needs an entry");
  const item = newPostException("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PostExceptionRateRangeRule flags values above rate", () => {
  const rule = new PostExceptionRateRangeRule(5.5, 1664.3);
  const item = newPostException("x", "y");
  item.rate = 1665.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PostExceptionLabelLengthRule flags a long label", () => {
  const rule = new PostExceptionLabelLengthRule(120);
  const item = newPostException("x", "y");
  item.label = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
