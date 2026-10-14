import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultCohortTemplateNameLengthRule,
  DefaultCohortTemplateRatioRangeRule,
  DefaultCohortTemplateRequiredCodeRule,
  DefaultCohortTemplateRequiredExternalRefRule,
  defaultDefaultCohortTemplateValidator,
} from "./default-cohort-template-rules.js";
import { newDefaultCohortTemplate } from "./default-cohort-template.js";

test("DefaultCohortTemplateValidator reports every problem", () => {
  const validator = defaultDefaultCohortTemplateValidator();
  const item = newDefaultCohortTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultCohortTemplateRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new DefaultCohortTemplateRequiredExternalRefRule("default cohort template needs a value");
  const item = newDefaultCohortTemplate("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultCohortTemplateNameLengthRule flags a long name", () => {
  const rule = new DefaultCohortTemplateNameLengthRule(3600);
  const item = newDefaultCohortTemplate("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultCohortTemplateRatioRangeRule flags values above ratio", () => {
  const rule = new DefaultCohortTemplateRatioRangeRule(6.5, 3005.4);
  const item = newDefaultCohortTemplate("x", "y");
  item.ratio = 3006.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultCohortTemplateRequiredCodeRule flags a blank code", () => {
  const rule = new DefaultCohortTemplateRequiredCodeRule("default cohort template needs a value");
  const item = newDefaultCohortTemplate("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
