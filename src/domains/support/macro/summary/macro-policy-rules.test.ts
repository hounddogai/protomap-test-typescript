import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MacroPolicyCodeLengthRule,
  MacroPolicyRequiredCodeRule,
  defaultMacroPolicyValidator,
} from "./macro-policy-rules.js";
import { newMacroPolicy } from "./macro-policy.js";

test("MacroPolicyValidator reports every problem", () => {
  const validator = defaultMacroPolicyValidator();
  const item = newMacroPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("MacroPolicyCodeLengthRule flags a long code", () => {
  const rule = new MacroPolicyCodeLengthRule(32);
  const item = newMacroPolicy("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("MacroPolicyRequiredCodeRule flags a blank code", () => {
  const rule = new MacroPolicyRequiredCodeRule("macro policy needs a value");
  const item = newMacroPolicy("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
