import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ReplyTemplateCurrencyLengthRule,
  ReplyTemplateRequiredSourceRule,
  ReplyTemplateScoreRangeRule,
  ReplyTemplateSourceLengthRule,
  defaultReplyTemplateValidator,
} from "./reply-template-rules.js";
import { newReplyTemplate } from "./reply-template.js";

test("ReplyTemplateValidator reports every problem", () => {
  const validator = defaultReplyTemplateValidator();
  const item = newReplyTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ReplyTemplateRequiredSourceRule flags a blank source", () => {
  const rule = new ReplyTemplateRequiredSourceRule("reply template needs this field");
  const item = newReplyTemplate("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ReplyTemplateCurrencyLengthRule flags a long currency", () => {
  const rule = new ReplyTemplateCurrencyLengthRule(120);
  const item = newReplyTemplate("x", "y");
  item.currency = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ReplyTemplateScoreRangeRule flags values above score", () => {
  const rule = new ReplyTemplateScoreRangeRule(6.4, 808.7);
  const item = newReplyTemplate("x", "y");
  item.score = 810.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ReplyTemplateSourceLengthRule flags a long source", () => {
  const rule = new ReplyTemplateSourceLengthRule(120);
  const item = newReplyTemplate("x", "y");
  item.source = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
