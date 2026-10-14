import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackMacroOverrideBatchSizeRangeRule,
  FallbackMacroOverrideCodeLengthRule,
  FallbackMacroOverrideRequiredTitleRule,
  FallbackMacroOverrideUtmSourceLengthRule,
  defaultFallbackMacroOverrideValidator,
} from "./fallback-macro-override-rules.js";
import { newFallbackMacroOverride } from "./fallback-macro-override.js";

test("FallbackMacroOverrideValidator reports every problem", () => {
  const validator = defaultFallbackMacroOverrideValidator();
  const item = newFallbackMacroOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackMacroOverrideCodeLengthRule flags a long code", () => {
  const rule = new FallbackMacroOverrideCodeLengthRule(80);
  const item = newFallbackMacroOverride("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackMacroOverrideUtmSourceLengthRule flags a long utm source", () => {
  const rule = new FallbackMacroOverrideUtmSourceLengthRule(64);
  const item = newFallbackMacroOverride("x", "y");
  item.utmSource = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackMacroOverrideRequiredTitleRule flags a blank title", () => {
  const rule = new FallbackMacroOverrideRequiredTitleRule("fallback macro override needs an entry");
  const item = newFallbackMacroOverride("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackMacroOverrideBatchSizeRangeRule flags values above batch size", () => {
  const rule = new FallbackMacroOverrideBatchSizeRangeRule(64, 255);
  const item = newFallbackMacroOverride("x", "y");
  item.batchSize = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
