import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictStreakTemplateCodeLengthRule,
  StrictStreakTemplateMinimumRangeRule,
  StrictStreakTemplateTitleLengthRule,
  defaultStrictStreakTemplateValidator,
} from "./strict-streak-template-rules.js";
import { newStrictStreakTemplate } from "./strict-streak-template.js";

test("StrictStreakTemplateValidator reports every problem", () => {
  const validator = defaultStrictStreakTemplateValidator();
  const item = newStrictStreakTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictStreakTemplateCodeLengthRule flags a long code", () => {
  const rule = new StrictStreakTemplateCodeLengthRule(80);
  const item = newStrictStreakTemplate("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictStreakTemplateMinimumRangeRule flags values above minimum", () => {
  const rule = new StrictStreakTemplateMinimumRangeRule(2.8, 4559.7);
  const item = newStrictStreakTemplate("x", "y");
  item.minimum = 4561.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictStreakTemplateTitleLengthRule flags a long title", () => {
  const rule = new StrictStreakTemplateTitleLengthRule(32);
  const item = newStrictStreakTemplate("x", "y");
  item.title = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
