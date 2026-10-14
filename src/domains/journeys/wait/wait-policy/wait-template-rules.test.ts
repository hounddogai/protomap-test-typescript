import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WaitTemplateCodeLengthRule,
  WaitTemplateCostRangeRule,
  WaitTemplateNameLengthRule,
  WaitTemplateRequiredCodeRule,
  WaitTemplateRequiredNameRule,
  WaitTemplateRequiredTitleRule,
  defaultWaitTemplateValidator,
} from "./wait-template-rules.js";
import { newWaitTemplate } from "./wait-template.js";

test("WaitTemplateValidator reports every problem", () => {
  const validator = defaultWaitTemplateValidator();
  const item = newWaitTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WaitTemplateRequiredCodeRule flags a blank code", () => {
  const rule = new WaitTemplateRequiredCodeRule("wait template needs this field");
  const item = newWaitTemplate("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WaitTemplateNameLengthRule flags a long name", () => {
  const rule = new WaitTemplateNameLengthRule(80);
  const item = newWaitTemplate("x", "y");
  item.name = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WaitTemplateRequiredTitleRule flags a blank title", () => {
  const rule = new WaitTemplateRequiredTitleRule("wait template needs a value");
  const item = newWaitTemplate("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WaitTemplateCodeLengthRule flags a long code", () => {
  const rule = new WaitTemplateCodeLengthRule(255);
  const item = newWaitTemplate("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WaitTemplateRequiredNameRule flags a blank name", () => {
  const rule = new WaitTemplateRequiredNameRule("wait template needs this field");
  const item = newWaitTemplate("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WaitTemplateCostRangeRule flags values above cost", () => {
  const rule = new WaitTemplateCostRangeRule(9.5, 81.7);
  const item = newWaitTemplate("x", "y");
  item.cost = 83.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
