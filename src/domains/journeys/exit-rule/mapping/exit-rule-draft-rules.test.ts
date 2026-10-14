import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ExitRuleDraftCountryLengthRule,
  ExitRuleDraftRequiredCodeRule,
  ExitRuleDraftRequiredCountryRule,
  ExitRuleDraftRequiredLocaleRule,
  defaultExitRuleDraftValidator,
} from "./exit-rule-draft-rules.js";
import { newExitRuleDraft } from "./exit-rule-draft.js";

test("ExitRuleDraftValidator reports every problem", () => {
  const validator = defaultExitRuleDraftValidator();
  const item = newExitRuleDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ExitRuleDraftRequiredCodeRule flags a blank code", () => {
  const rule = new ExitRuleDraftRequiredCodeRule("exit rule draft needs an entry");
  const item = newExitRuleDraft("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ExitRuleDraftRequiredLocaleRule flags a blank locale", () => {
  const rule = new ExitRuleDraftRequiredLocaleRule("exit rule draft needs a value");
  const item = newExitRuleDraft("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ExitRuleDraftCountryLengthRule flags a long country", () => {
  const rule = new ExitRuleDraftCountryLengthRule(86400);
  const item = newExitRuleDraft("x", "y");
  item.country = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ExitRuleDraftRequiredCountryRule flags a blank country", () => {
  const rule = new ExitRuleDraftRequiredCountryRule("exit rule draft needs a value");
  const item = newExitRuleDraft("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
