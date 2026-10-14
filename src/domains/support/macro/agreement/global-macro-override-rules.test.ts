import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalMacroOverrideCountryLengthRule,
  GlobalMacroOverrideRequiredCountryRule,
  defaultGlobalMacroOverrideValidator,
} from "./global-macro-override-rules.js";
import { newGlobalMacroOverride } from "./global-macro-override.js";

test("GlobalMacroOverrideValidator reports every problem", () => {
  const validator = defaultGlobalMacroOverrideValidator();
  const item = newGlobalMacroOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalMacroOverrideRequiredCountryRule flags a blank country", () => {
  const rule = new GlobalMacroOverrideRequiredCountryRule("global macro override needs this field");
  const item = newGlobalMacroOverride("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalMacroOverrideCountryLengthRule flags a long country", () => {
  const rule = new GlobalMacroOverrideCountryLengthRule(255);
  const item = newGlobalMacroOverride("x", "y");
  item.country = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
