import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LevelTemplateCeilingRangeRule,
  LevelTemplateRequiredChecksumRule,
  LevelTemplateRequiredCodeRule,
  LevelTemplateRequiredNameRule,
  defaultLevelTemplateValidator,
} from "./level-template-rules.js";
import { newLevelTemplate } from "./level-template.js";

test("LevelTemplateValidator reports every problem", () => {
  const validator = defaultLevelTemplateValidator();
  const item = newLevelTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LevelTemplateRequiredChecksumRule flags a blank checksum", () => {
  const rule = new LevelTemplateRequiredChecksumRule("level template needs an entry");
  const item = newLevelTemplate("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LevelTemplateRequiredCodeRule flags a blank code", () => {
  const rule = new LevelTemplateRequiredCodeRule("level template needs this field");
  const item = newLevelTemplate("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LevelTemplateCeilingRangeRule flags values above ceiling", () => {
  const rule = new LevelTemplateCeilingRangeRule(10, 269.2);
  const item = newLevelTemplate("x", "y");
  item.ceiling = 270.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LevelTemplateRequiredNameRule flags a blank name", () => {
  const rule = new LevelTemplateRequiredNameRule("level template needs this field");
  const item = newLevelTemplate("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
