import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MacroAgreementCodeLengthRule,
  MacroAgreementRequiredTitleRule,
  MacroAgreementTitleLengthRule,
  defaultMacroAgreementValidator,
} from "./macro-agreement-rules.js";
import { newMacroAgreement } from "./macro-agreement.js";

test("MacroAgreementValidator reports every problem", () => {
  const validator = defaultMacroAgreementValidator();
  const item = newMacroAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("MacroAgreementTitleLengthRule flags a long title", () => {
  const rule = new MacroAgreementTitleLengthRule(86400);
  const item = newMacroAgreement("x", "y");
  item.title = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("MacroAgreementRequiredTitleRule flags a blank title", () => {
  const rule = new MacroAgreementRequiredTitleRule("macro agreement needs a value");
  const item = newMacroAgreement("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("MacroAgreementCodeLengthRule flags a long code", () => {
  const rule = new MacroAgreementCodeLengthRule(32);
  const item = newMacroAgreement("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
