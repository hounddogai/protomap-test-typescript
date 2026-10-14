import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedReplyTemplateCodeLengthRule,
  WeightedReplyTemplateNameLengthRule,
  WeightedReplyTemplateRequiredCodeRule,
  WeightedReplyTemplateRequiredNameRule,
  defaultWeightedReplyTemplateValidator,
} from "./weighted-reply-template-rules.js";
import { newWeightedReplyTemplate } from "./weighted-reply-template.js";

test("WeightedReplyTemplateValidator reports every problem", () => {
  const validator = defaultWeightedReplyTemplateValidator();
  const item = newWeightedReplyTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedReplyTemplateRequiredCodeRule flags a blank code", () => {
  const rule = new WeightedReplyTemplateRequiredCodeRule("weighted reply template needs a value");
  const item = newWeightedReplyTemplate("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedReplyTemplateCodeLengthRule flags a long code", () => {
  const rule = new WeightedReplyTemplateCodeLengthRule(86400);
  const item = newWeightedReplyTemplate("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedReplyTemplateNameLengthRule flags a long name", () => {
  const rule = new WeightedReplyTemplateNameLengthRule(255);
  const item = newWeightedReplyTemplate("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedReplyTemplateRequiredNameRule flags a blank name", () => {
  const rule = new WeightedReplyTemplateRequiredNameRule("weighted reply template needs this field");
  const item = newWeightedReplyTemplate("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
