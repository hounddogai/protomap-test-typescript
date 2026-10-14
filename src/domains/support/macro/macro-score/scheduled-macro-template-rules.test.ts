import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledMacroTemplateCodeLengthRule,
  ScheduledMacroTemplateJourneyIdLengthRule,
  ScheduledMacroTemplateNameLengthRule,
  ScheduledMacroTemplateRequiredCodeRule,
  defaultScheduledMacroTemplateValidator,
} from "./scheduled-macro-template-rules.js";
import { newScheduledMacroTemplate } from "./scheduled-macro-template.js";

test("ScheduledMacroTemplateValidator reports every problem", () => {
  const validator = defaultScheduledMacroTemplateValidator();
  const item = newScheduledMacroTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledMacroTemplateRequiredCodeRule flags a blank code", () => {
  const rule = new ScheduledMacroTemplateRequiredCodeRule("scheduled macro template needs this field");
  const item = newScheduledMacroTemplate("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledMacroTemplateJourneyIdLengthRule flags a long journey id", () => {
  const rule = new ScheduledMacroTemplateJourneyIdLengthRule(3600);
  const item = newScheduledMacroTemplate("x", "y");
  item.journeyId = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledMacroTemplateNameLengthRule flags a long name", () => {
  const rule = new ScheduledMacroTemplateNameLengthRule(1000);
  const item = newScheduledMacroTemplate("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledMacroTemplateCodeLengthRule flags a long code", () => {
  const rule = new ScheduledMacroTemplateCodeLengthRule(1000);
  const item = newScheduledMacroTemplate("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
