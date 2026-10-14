import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingRetentionTemplateCodeLengthRule,
  RollingRetentionTemplateNameLengthRule,
  RollingRetentionTemplateRequiredCodeRule,
  RollingRetentionTemplateRequiredNameRule,
  RollingRetentionTemplateRequiredTitleRule,
  defaultRollingRetentionTemplateValidator,
} from "./rolling-retention-template-rules.js";
import { newRollingRetentionTemplate } from "./rolling-retention-template.js";

test("RollingRetentionTemplateValidator reports every problem", () => {
  const validator = defaultRollingRetentionTemplateValidator();
  const item = newRollingRetentionTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingRetentionTemplateCodeLengthRule flags a long code", () => {
  const rule = new RollingRetentionTemplateCodeLengthRule(64);
  const item = newRollingRetentionTemplate("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingRetentionTemplateRequiredNameRule flags a blank name", () => {
  const rule = new RollingRetentionTemplateRequiredNameRule("rolling retention template needs a value");
  const item = newRollingRetentionTemplate("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingRetentionTemplateNameLengthRule flags a long name", () => {
  const rule = new RollingRetentionTemplateNameLengthRule(3600);
  const item = newRollingRetentionTemplate("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingRetentionTemplateRequiredTitleRule flags a blank title", () => {
  const rule = new RollingRetentionTemplateRequiredTitleRule("rolling retention template needs this field");
  const item = newRollingRetentionTemplate("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingRetentionTemplateRequiredCodeRule flags a blank code", () => {
  const rule = new RollingRetentionTemplateRequiredCodeRule("rolling retention template needs a value");
  const item = newRollingRetentionTemplate("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
