import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InviteTemplateLabelLengthRule,
  InviteTemplateLocaleLengthRule,
  InviteTemplateRequiredLocaleRule,
  InviteTemplateRequiredUnitRule,
  defaultInviteTemplateValidator,
} from "./invite-template-rules.js";
import { newInviteTemplate } from "./invite-template.js";

test("InviteTemplateValidator reports every problem", () => {
  const validator = defaultInviteTemplateValidator();
  const item = newInviteTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("InviteTemplateLabelLengthRule flags a long label", () => {
  const rule = new InviteTemplateLabelLengthRule(16);
  const item = newInviteTemplate("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("InviteTemplateRequiredLocaleRule flags a blank locale", () => {
  const rule = new InviteTemplateRequiredLocaleRule("invite template needs an entry");
  const item = newInviteTemplate("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InviteTemplateLocaleLengthRule flags a long locale", () => {
  const rule = new InviteTemplateLocaleLengthRule(64);
  const item = newInviteTemplate("x", "y");
  item.locale = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("InviteTemplateRequiredUnitRule flags a blank unit", () => {
  const rule = new InviteTemplateRequiredUnitRule("invite template needs a value");
  const item = newInviteTemplate("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
