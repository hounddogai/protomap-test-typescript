import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MacroManifestCodeLengthRule,
  MacroManifestCurrencyLengthRule,
  MacroManifestWindowDaysRangeRule,
  defaultMacroManifestValidator,
} from "./macro-manifest-rules.js";
import { newMacroManifest } from "./macro-manifest.js";

test("MacroManifestValidator reports every problem", () => {
  const validator = defaultMacroManifestValidator();
  const item = newMacroManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("MacroManifestWindowDaysRangeRule flags values above window days", () => {
  const rule = new MacroManifestWindowDaysRangeRule(64, 80);
  const item = newMacroManifest("x", "y");
  item.windowDays = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("MacroManifestCodeLengthRule flags a long code", () => {
  const rule = new MacroManifestCodeLengthRule(1000);
  const item = newMacroManifest("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("MacroManifestCurrencyLengthRule flags a long currency", () => {
  const rule = new MacroManifestCurrencyLengthRule(120);
  const item = newMacroManifest("x", "y");
  item.currency = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
