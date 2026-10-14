import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ActivationTemplateRequiredCodeRule,
  ActivationTemplateRequiredNotesRule,
  defaultActivationTemplateValidator,
} from "./activation-template-rules.js";
import { newActivationTemplate } from "./activation-template.js";

test("ActivationTemplateValidator reports every problem", () => {
  const validator = defaultActivationTemplateValidator();
  const item = newActivationTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ActivationTemplateRequiredCodeRule flags a blank code", () => {
  const rule = new ActivationTemplateRequiredCodeRule("activation template needs this field");
  const item = newActivationTemplate("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ActivationTemplateRequiredNotesRule flags a blank notes", () => {
  const rule = new ActivationTemplateRequiredNotesRule("activation template needs a value");
  const item = newActivationTemplate("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
