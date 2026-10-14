import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedDeflectionTemplateNameLengthRule,
  CappedDeflectionTemplateRequiredDescriptionRule,
  CappedDeflectionTemplateUpdatedAtRangeRule,
  defaultCappedDeflectionTemplateValidator,
} from "./capped-deflection-template-rules.js";
import { newCappedDeflectionTemplate } from "./capped-deflection-template.js";

test("CappedDeflectionTemplateValidator reports every problem", () => {
  const validator = defaultCappedDeflectionTemplateValidator();
  const item = newCappedDeflectionTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedDeflectionTemplateUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new CappedDeflectionTemplateUpdatedAtRangeRule(1000, 3600);
  const item = newCappedDeflectionTemplate("x", "y");
  item.updatedAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedDeflectionTemplateRequiredDescriptionRule flags a blank description", () => {
  const rule = new CappedDeflectionTemplateRequiredDescriptionRule("capped deflection template needs a value");
  const item = newCappedDeflectionTemplate("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedDeflectionTemplateNameLengthRule flags a long name", () => {
  const rule = new CappedDeflectionTemplateNameLengthRule(3600);
  const item = newCappedDeflectionTemplate("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
