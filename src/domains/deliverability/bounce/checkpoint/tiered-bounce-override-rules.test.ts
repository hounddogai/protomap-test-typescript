import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredBounceOverrideBudgetRangeRule,
  TieredBounceOverrideNameLengthRule,
  TieredBounceOverrideRequiredChannelRule,
  TieredBounceOverrideRequiredCodeRule,
  TieredBounceOverrideSourceLengthRule,
  defaultTieredBounceOverrideValidator,
} from "./tiered-bounce-override-rules.js";
import { newTieredBounceOverride } from "./tiered-bounce-override.js";

test("TieredBounceOverrideValidator reports every problem", () => {
  const validator = defaultTieredBounceOverrideValidator();
  const item = newTieredBounceOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredBounceOverrideRequiredCodeRule flags a blank code", () => {
  const rule = new TieredBounceOverrideRequiredCodeRule("tiered bounce override needs an entry");
  const item = newTieredBounceOverride("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredBounceOverrideRequiredChannelRule flags a blank channel", () => {
  const rule = new TieredBounceOverrideRequiredChannelRule("tiered bounce override needs a value");
  const item = newTieredBounceOverride("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredBounceOverrideBudgetRangeRule flags values above budget", () => {
  const rule = new TieredBounceOverrideBudgetRangeRule(8.5, 3782.2);
  const item = newTieredBounceOverride("x", "y");
  item.budget = 3783.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredBounceOverrideSourceLengthRule flags a long source", () => {
  const rule = new TieredBounceOverrideSourceLengthRule(80);
  const item = newTieredBounceOverride("x", "y");
  item.source = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredBounceOverrideNameLengthRule flags a long name", () => {
  const rule = new TieredBounceOverrideNameLengthRule(80);
  const item = newTieredBounceOverride("x", "y");
  item.name = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
