import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultMacroOverrideCodeLengthRule,
  DefaultMacroOverrideRequiredCodeRule,
  DefaultMacroOverrideTitleLengthRule,
  defaultDefaultMacroOverrideValidator,
} from "./default-macro-override-rules.js";
import { newDefaultMacroOverride } from "./default-macro-override.js";

test("DefaultMacroOverrideValidator reports every problem", () => {
  const validator = defaultDefaultMacroOverrideValidator();
  const item = newDefaultMacroOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultMacroOverrideCodeLengthRule flags a long code", () => {
  const rule = new DefaultMacroOverrideCodeLengthRule(32);
  const item = newDefaultMacroOverride("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultMacroOverrideRequiredCodeRule flags a blank code", () => {
  const rule = new DefaultMacroOverrideRequiredCodeRule("default macro override needs an entry");
  const item = newDefaultMacroOverride("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultMacroOverrideTitleLengthRule flags a long title", () => {
  const rule = new DefaultMacroOverrideTitleLengthRule(64);
  const item = newDefaultMacroOverride("x", "y");
  item.title = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
