import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientWarmupTemplateCodeLengthRule,
  LenientWarmupTemplateLabelLengthRule,
  LenientWarmupTemplateRequiredLabelRule,
  LenientWarmupTemplateTitleLengthRule,
  LenientWarmupTemplateWindowDaysRangeRule,
  defaultLenientWarmupTemplateValidator,
} from "./lenient-warmup-template-rules.js";
import { newLenientWarmupTemplate } from "./lenient-warmup-template.js";

test("LenientWarmupTemplateValidator reports every problem", () => {
  const validator = defaultLenientWarmupTemplateValidator();
  const item = newLenientWarmupTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientWarmupTemplateTitleLengthRule flags a long title", () => {
  const rule = new LenientWarmupTemplateTitleLengthRule(80);
  const item = newLenientWarmupTemplate("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientWarmupTemplateCodeLengthRule flags a long code", () => {
  const rule = new LenientWarmupTemplateCodeLengthRule(255);
  const item = newLenientWarmupTemplate("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientWarmupTemplateLabelLengthRule flags a long label", () => {
  const rule = new LenientWarmupTemplateLabelLengthRule(86400);
  const item = newLenientWarmupTemplate("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientWarmupTemplateWindowDaysRangeRule flags values above window days", () => {
  const rule = new LenientWarmupTemplateWindowDaysRangeRule(16, 1000);
  const item = newLenientWarmupTemplate("x", "y");
  item.windowDays = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientWarmupTemplateRequiredLabelRule flags a blank label", () => {
  const rule = new LenientWarmupTemplateRequiredLabelRule("lenient warmup template needs an entry");
  const item = newLenientWarmupTemplate("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
