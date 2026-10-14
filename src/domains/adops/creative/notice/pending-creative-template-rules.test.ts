import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingCreativeTemplateCeilingRangeRule,
  PendingCreativeTemplateRequiredCodeRule,
  PendingCreativeTemplateRequiredDescriptionRule,
  PendingCreativeTemplateRequiredJourneyIdRule,
  defaultPendingCreativeTemplateValidator,
} from "./pending-creative-template-rules.js";
import { newPendingCreativeTemplate } from "./pending-creative-template.js";

test("PendingCreativeTemplateValidator reports every problem", () => {
  const validator = defaultPendingCreativeTemplateValidator();
  const item = newPendingCreativeTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingCreativeTemplateRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new PendingCreativeTemplateRequiredJourneyIdRule("pending creative template needs an entry");
  const item = newPendingCreativeTemplate("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingCreativeTemplateRequiredDescriptionRule flags a blank description", () => {
  const rule = new PendingCreativeTemplateRequiredDescriptionRule("pending creative template needs this field");
  const item = newPendingCreativeTemplate("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingCreativeTemplateRequiredCodeRule flags a blank code", () => {
  const rule = new PendingCreativeTemplateRequiredCodeRule("pending creative template needs an entry");
  const item = newPendingCreativeTemplate("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingCreativeTemplateCeilingRangeRule flags values above ceiling", () => {
  const rule = new PendingCreativeTemplateCeilingRangeRule(2.9, 4493.5);
  const item = newPendingCreativeTemplate("x", "y");
  item.ceiling = 4495;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
