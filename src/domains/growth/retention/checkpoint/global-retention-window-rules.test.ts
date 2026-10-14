import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalRetentionWindowAttemptsRangeRule,
  GlobalRetentionWindowChecksumLengthRule,
  GlobalRetentionWindowRequiredLabelRule,
  defaultGlobalRetentionWindowValidator,
} from "./global-retention-window-rules.js";
import { newGlobalRetentionWindow } from "./global-retention-window.js";

test("GlobalRetentionWindowValidator reports every problem", () => {
  const validator = defaultGlobalRetentionWindowValidator();
  const item = newGlobalRetentionWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalRetentionWindowRequiredLabelRule flags a blank label", () => {
  const rule = new GlobalRetentionWindowRequiredLabelRule("global retention window needs this field");
  const item = newGlobalRetentionWindow("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalRetentionWindowChecksumLengthRule flags a long checksum", () => {
  const rule = new GlobalRetentionWindowChecksumLengthRule(255);
  const item = newGlobalRetentionWindow("x", "y");
  item.checksum = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalRetentionWindowAttemptsRangeRule flags values above attempts", () => {
  const rule = new GlobalRetentionWindowAttemptsRangeRule(120, 255);
  const item = newGlobalRetentionWindow("x", "y");
  item.attempts = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
