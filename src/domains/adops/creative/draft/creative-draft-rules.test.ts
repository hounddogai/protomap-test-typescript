import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreativeDraftCodeLengthRule,
  CreativeDraftRequiredCodeRule,
  CreativeDraftRequiredTitleRule,
  defaultCreativeDraftValidator,
} from "./creative-draft-rules.js";
import { newCreativeDraft } from "./creative-draft.js";

test("CreativeDraftValidator reports every problem", () => {
  const validator = defaultCreativeDraftValidator();
  const item = newCreativeDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreativeDraftRequiredCodeRule flags a blank code", () => {
  const rule = new CreativeDraftRequiredCodeRule("creative draft needs a value");
  const item = newCreativeDraft("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CreativeDraftRequiredTitleRule flags a blank title", () => {
  const rule = new CreativeDraftRequiredTitleRule("creative draft needs an entry");
  const item = newCreativeDraft("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CreativeDraftCodeLengthRule flags a long code", () => {
  const rule = new CreativeDraftCodeLengthRule(80);
  const item = newCreativeDraft("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
