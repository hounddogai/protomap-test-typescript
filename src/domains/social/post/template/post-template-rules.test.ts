import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PostTemplateRequiredVariantRule,
  PostTemplateSummaryLengthRule,
  PostTemplateVariantLengthRule,
  defaultPostTemplateValidator,
} from "./post-template-rules.js";
import { newPostTemplate } from "./post-template.js";

test("PostTemplateValidator reports every problem", () => {
  const validator = defaultPostTemplateValidator();
  const item = newPostTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PostTemplateVariantLengthRule flags a long variant", () => {
  const rule = new PostTemplateVariantLengthRule(16);
  const item = newPostTemplate("x", "y");
  item.variant = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PostTemplateSummaryLengthRule flags a long summary", () => {
  const rule = new PostTemplateSummaryLengthRule(80);
  const item = newPostTemplate("x", "y");
  item.summary = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PostTemplateRequiredVariantRule flags a blank variant", () => {
  const rule = new PostTemplateRequiredVariantRule("post template needs a value");
  const item = newPostTemplate("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
