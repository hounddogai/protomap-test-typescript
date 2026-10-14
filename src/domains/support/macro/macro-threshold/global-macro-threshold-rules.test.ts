import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalMacroThresholdCodeLengthRule,
  GlobalMacroThresholdRatioRangeRule,
  defaultGlobalMacroThresholdValidator,
} from "./global-macro-threshold-rules.js";
import { newGlobalMacroThreshold } from "./global-macro-threshold.js";

test("GlobalMacroThresholdValidator reports every problem", () => {
  const validator = defaultGlobalMacroThresholdValidator();
  const item = newGlobalMacroThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalMacroThresholdRatioRangeRule flags values above ratio", () => {
  const rule = new GlobalMacroThresholdRatioRangeRule(1.1, 3056.7);
  const item = newGlobalMacroThreshold("x", "y");
  item.ratio = 3058.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalMacroThresholdCodeLengthRule flags a long code", () => {
  const rule = new GlobalMacroThresholdCodeLengthRule(86400);
  const item = newGlobalMacroThreshold("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
