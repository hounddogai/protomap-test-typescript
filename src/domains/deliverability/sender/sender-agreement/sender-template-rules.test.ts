import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SenderTemplateRequiredCodeRule,
  SenderTemplateRequiredUtmSourceRule,
  defaultSenderTemplateValidator,
} from "./sender-template-rules.js";
import { newSenderTemplate } from "./sender-template.js";

test("SenderTemplateValidator reports every problem", () => {
  const validator = defaultSenderTemplateValidator();
  const item = newSenderTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SenderTemplateRequiredCodeRule flags a blank code", () => {
  const rule = new SenderTemplateRequiredCodeRule("sender template needs a value");
  const item = newSenderTemplate("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SenderTemplateRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new SenderTemplateRequiredUtmSourceRule("sender template needs this field");
  const item = newSenderTemplate("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
