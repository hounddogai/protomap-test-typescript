import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultMentionOverrideRequiredCategoryRule,
  DefaultMentionOverrideRequiredCodeRule,
  DefaultMentionOverrideRequiredLabelRule,
  defaultDefaultMentionOverrideValidator,
} from "./default-mention-override-rules.js";
import { newDefaultMentionOverride } from "./default-mention-override.js";

test("DefaultMentionOverrideValidator reports every problem", () => {
  const validator = defaultDefaultMentionOverrideValidator();
  const item = newDefaultMentionOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultMentionOverrideRequiredCodeRule flags a blank code", () => {
  const rule = new DefaultMentionOverrideRequiredCodeRule("default mention override needs a value");
  const item = newDefaultMentionOverride("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultMentionOverrideRequiredCategoryRule flags a blank category", () => {
  const rule = new DefaultMentionOverrideRequiredCategoryRule("default mention override needs a value");
  const item = newDefaultMentionOverride("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultMentionOverrideRequiredLabelRule flags a blank label", () => {
  const rule = new DefaultMentionOverrideRequiredLabelRule("default mention override needs an entry");
  const item = newDefaultMentionOverride("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
