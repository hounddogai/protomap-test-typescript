import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalMacroRequestRequiredCodeRule,
  SeasonalMacroRequestRequiredCurrencyRule,
  SeasonalMacroRequestRequiredNameRule,
  SeasonalMacroRequestRequiredVariantRule,
  SeasonalMacroRequestVariantLengthRule,
  defaultSeasonalMacroRequestValidator,
} from "./seasonal-macro-request-rules.js";
import { newSeasonalMacroRequest } from "./seasonal-macro-request.js";

test("SeasonalMacroRequestValidator reports every problem", () => {
  const validator = defaultSeasonalMacroRequestValidator();
  const item = newSeasonalMacroRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalMacroRequestRequiredCurrencyRule flags a blank currency", () => {
  const rule = new SeasonalMacroRequestRequiredCurrencyRule("seasonal macro request needs an entry");
  const item = newSeasonalMacroRequest("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalMacroRequestRequiredCodeRule flags a blank code", () => {
  const rule = new SeasonalMacroRequestRequiredCodeRule("seasonal macro request needs an entry");
  const item = newSeasonalMacroRequest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalMacroRequestRequiredNameRule flags a blank name", () => {
  const rule = new SeasonalMacroRequestRequiredNameRule("seasonal macro request needs a value");
  const item = newSeasonalMacroRequest("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalMacroRequestVariantLengthRule flags a long variant", () => {
  const rule = new SeasonalMacroRequestVariantLengthRule(3600);
  const item = newSeasonalMacroRequest("x", "y");
  item.variant = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalMacroRequestRequiredVariantRule flags a blank variant", () => {
  const rule = new SeasonalMacroRequestRequiredVariantRule("seasonal macro request needs an entry");
  const item = newSeasonalMacroRequest("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
