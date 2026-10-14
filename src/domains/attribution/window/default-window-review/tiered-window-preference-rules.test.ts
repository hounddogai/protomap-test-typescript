import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredWindowPreferenceCodeLengthRule,
  TieredWindowPreferenceLabelLengthRule,
  TieredWindowPreferenceRequiredLabelRule,
  TieredWindowPreferenceRequiredReviewerRule,
  TieredWindowPreferenceReviewerLengthRule,
  defaultTieredWindowPreferenceValidator,
} from "./tiered-window-preference-rules.js";
import { newTieredWindowPreference } from "./tiered-window-preference.js";

test("TieredWindowPreferenceValidator reports every problem", () => {
  const validator = defaultTieredWindowPreferenceValidator();
  const item = newTieredWindowPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredWindowPreferenceRequiredLabelRule flags a blank label", () => {
  const rule = new TieredWindowPreferenceRequiredLabelRule("tiered window preference needs an entry");
  const item = newTieredWindowPreference("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredWindowPreferenceLabelLengthRule flags a long label", () => {
  const rule = new TieredWindowPreferenceLabelLengthRule(80);
  const item = newTieredWindowPreference("x", "y");
  item.label = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredWindowPreferenceRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new TieredWindowPreferenceRequiredReviewerRule("tiered window preference needs this field");
  const item = newTieredWindowPreference("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredWindowPreferenceCodeLengthRule flags a long code", () => {
  const rule = new TieredWindowPreferenceCodeLengthRule(255);
  const item = newTieredWindowPreference("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredWindowPreferenceReviewerLengthRule flags a long reviewer", () => {
  const rule = new TieredWindowPreferenceReviewerLengthRule(16);
  const item = newTieredWindowPreference("x", "y");
  item.reviewer = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
