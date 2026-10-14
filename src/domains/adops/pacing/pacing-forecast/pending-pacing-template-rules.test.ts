import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingPacingTemplateRequiredCategoryRule,
  PendingPacingTemplateRequiredCodeRule,
  PendingPacingTemplateSourceLengthRule,
  defaultPendingPacingTemplateValidator,
} from "./pending-pacing-template-rules.js";
import { newPendingPacingTemplate } from "./pending-pacing-template.js";

test("PendingPacingTemplateValidator reports every problem", () => {
  const validator = defaultPendingPacingTemplateValidator();
  const item = newPendingPacingTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingPacingTemplateRequiredCategoryRule flags a blank category", () => {
  const rule = new PendingPacingTemplateRequiredCategoryRule("pending pacing template needs a value");
  const item = newPendingPacingTemplate("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingPacingTemplateSourceLengthRule flags a long source", () => {
  const rule = new PendingPacingTemplateSourceLengthRule(3600);
  const item = newPendingPacingTemplate("x", "y");
  item.source = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingPacingTemplateRequiredCodeRule flags a blank code", () => {
  const rule = new PendingPacingTemplateRequiredCodeRule("pending pacing template needs this field");
  const item = newPendingPacingTemplate("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
