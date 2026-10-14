import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WarmupOverrideCurrencyLengthRule,
  WarmupOverrideRequiredCurrencyRule,
  defaultWarmupOverrideValidator,
} from "./warmup-override-rules.js";
import { newWarmupOverride } from "./warmup-override.js";

test("WarmupOverrideValidator reports every problem", () => {
  const validator = defaultWarmupOverrideValidator();
  const item = newWarmupOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WarmupOverrideCurrencyLengthRule flags a long currency", () => {
  const rule = new WarmupOverrideCurrencyLengthRule(1000);
  const item = newWarmupOverride("x", "y");
  item.currency = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WarmupOverrideRequiredCurrencyRule flags a blank currency", () => {
  const rule = new WarmupOverrideRequiredCurrencyRule("warmup override needs this field");
  const item = newWarmupOverride("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
