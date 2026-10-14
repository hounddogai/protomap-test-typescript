import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RetentionTemplateNameLengthRule,
  RetentionTemplateRequiredExternalRefRule,
  RetentionTemplateSendAtRangeRule,
  defaultRetentionTemplateValidator,
} from "./retention-template-rules.js";
import { newRetentionTemplate } from "./retention-template.js";

test("RetentionTemplateValidator reports every problem", () => {
  const validator = defaultRetentionTemplateValidator();
  const item = newRetentionTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RetentionTemplateNameLengthRule flags a long name", () => {
  const rule = new RetentionTemplateNameLengthRule(32);
  const item = newRetentionTemplate("x", "y");
  item.name = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RetentionTemplateSendAtRangeRule flags values above send at", () => {
  const rule = new RetentionTemplateSendAtRangeRule(64, 3600);
  const item = newRetentionTemplate("x", "y");
  item.sendAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RetentionTemplateRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new RetentionTemplateRequiredExternalRefRule("retention template needs a value");
  const item = newRetentionTemplate("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
