import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledWarmupTemplateCodeLengthRule,
  ScheduledWarmupTemplateLocaleLengthRule,
  ScheduledWarmupTemplateMarginRangeRule,
  ScheduledWarmupTemplateRequiredCodeRule,
  defaultScheduledWarmupTemplateValidator,
} from "./scheduled-warmup-template-rules.js";
import { newScheduledWarmupTemplate } from "./scheduled-warmup-template.js";

test("ScheduledWarmupTemplateValidator reports every problem", () => {
  const validator = defaultScheduledWarmupTemplateValidator();
  const item = newScheduledWarmupTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledWarmupTemplateLocaleLengthRule flags a long locale", () => {
  const rule = new ScheduledWarmupTemplateLocaleLengthRule(64);
  const item = newScheduledWarmupTemplate("x", "y");
  item.locale = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledWarmupTemplateCodeLengthRule flags a long code", () => {
  const rule = new ScheduledWarmupTemplateCodeLengthRule(64);
  const item = newScheduledWarmupTemplate("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledWarmupTemplateMarginRangeRule flags values above margin", () => {
  const rule = new ScheduledWarmupTemplateMarginRangeRule(7.4, 346.2);
  const item = newScheduledWarmupTemplate("x", "y");
  item.margin = 347.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledWarmupTemplateRequiredCodeRule flags a blank code", () => {
  const rule = new ScheduledWarmupTemplateRequiredCodeRule("scheduled warmup template needs a value");
  const item = newScheduledWarmupTemplate("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
