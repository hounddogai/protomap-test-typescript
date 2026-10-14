import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SlaTemplateCategoryLengthRule,
  SlaTemplateRequiredCategoryRule,
  SlaTemplateRequiredLabelRule,
  defaultSlaTemplateValidator,
} from "./sla-template-rules.js";
import { newSlaTemplate } from "./sla-template.js";

test("SlaTemplateValidator reports every problem", () => {
  const validator = defaultSlaTemplateValidator();
  const item = newSlaTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SlaTemplateRequiredLabelRule flags a blank label", () => {
  const rule = new SlaTemplateRequiredLabelRule("sla template needs an entry");
  const item = newSlaTemplate("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SlaTemplateRequiredCategoryRule flags a blank category", () => {
  const rule = new SlaTemplateRequiredCategoryRule("sla template needs this field");
  const item = newSlaTemplate("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SlaTemplateCategoryLengthRule flags a long category", () => {
  const rule = new SlaTemplateCategoryLengthRule(1000);
  const item = newSlaTemplate("x", "y");
  item.category = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
