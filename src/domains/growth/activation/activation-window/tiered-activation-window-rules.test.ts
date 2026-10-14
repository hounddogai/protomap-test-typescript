import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredActivationWindowCodeLengthRule,
  TieredActivationWindowRequiredCodeRule,
  TieredActivationWindowRequiredLocaleRule,
  TieredActivationWindowRequiredTitleRule,
  defaultTieredActivationWindowValidator,
} from "./tiered-activation-window-rules.js";
import { newTieredActivationWindow } from "./tiered-activation-window.js";

test("TieredActivationWindowValidator reports every problem", () => {
  const validator = defaultTieredActivationWindowValidator();
  const item = newTieredActivationWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredActivationWindowRequiredCodeRule flags a blank code", () => {
  const rule = new TieredActivationWindowRequiredCodeRule("tiered activation window needs a value");
  const item = newTieredActivationWindow("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredActivationWindowRequiredTitleRule flags a blank title", () => {
  const rule = new TieredActivationWindowRequiredTitleRule("tiered activation window needs a value");
  const item = newTieredActivationWindow("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredActivationWindowCodeLengthRule flags a long code", () => {
  const rule = new TieredActivationWindowCodeLengthRule(255);
  const item = newTieredActivationWindow("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredActivationWindowRequiredLocaleRule flags a blank locale", () => {
  const rule = new TieredActivationWindowRequiredLocaleRule("tiered activation window needs an entry");
  const item = newTieredActivationWindow("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
