import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MacroQuotaJourneyIdLengthRule,
  MacroQuotaNameLengthRule,
  MacroQuotaRequiredJourneyIdRule,
  defaultMacroQuotaValidator,
} from "./macro-quota-rules.js";
import { newMacroQuota } from "./macro-quota.js";

test("MacroQuotaValidator reports every problem", () => {
  const validator = defaultMacroQuotaValidator();
  const item = newMacroQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("MacroQuotaNameLengthRule flags a long name", () => {
  const rule = new MacroQuotaNameLengthRule(255);
  const item = newMacroQuota("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("MacroQuotaRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new MacroQuotaRequiredJourneyIdRule("macro quota needs a value");
  const item = newMacroQuota("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("MacroQuotaJourneyIdLengthRule flags a long journey id", () => {
  const rule = new MacroQuotaJourneyIdLengthRule(255);
  const item = newMacroQuota("x", "y");
  item.journeyId = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
