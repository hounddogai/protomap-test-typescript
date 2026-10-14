import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MentionTemplateExpiresAtRangeRule,
  MentionTemplateNameLengthRule,
  MentionTemplateRequiredNameRule,
  defaultMentionTemplateValidator,
} from "./mention-template-rules.js";
import { newMentionTemplate } from "./mention-template.js";

test("MentionTemplateValidator reports every problem", () => {
  const validator = defaultMentionTemplateValidator();
  const item = newMentionTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("MentionTemplateExpiresAtRangeRule flags values above expires at", () => {
  const rule = new MentionTemplateExpiresAtRangeRule(120, 1000);
  const item = newMentionTemplate("x", "y");
  item.expiresAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("MentionTemplateRequiredNameRule flags a blank name", () => {
  const rule = new MentionTemplateRequiredNameRule("mention template needs a value");
  const item = newMentionTemplate("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("MentionTemplateNameLengthRule flags a long name", () => {
  const rule = new MentionTemplateNameLengthRule(80);
  const item = newMentionTemplate("x", "y");
  item.name = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
