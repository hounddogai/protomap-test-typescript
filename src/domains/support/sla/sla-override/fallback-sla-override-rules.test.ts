import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackSlaOverrideDiscountRangeRule,
  FallbackSlaOverrideRequiredChannelRule,
  FallbackSlaOverrideRequiredSourceRule,
  FallbackSlaOverrideSourceLengthRule,
  defaultFallbackSlaOverrideValidator,
} from "./fallback-sla-override-rules.js";
import { newFallbackSlaOverride } from "./fallback-sla-override.js";

test("FallbackSlaOverrideValidator reports every problem", () => {
  const validator = defaultFallbackSlaOverrideValidator();
  const item = newFallbackSlaOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackSlaOverrideDiscountRangeRule flags values above discount", () => {
  const rule = new FallbackSlaOverrideDiscountRangeRule(9.8, 1967.7);
  const item = newFallbackSlaOverride("x", "y");
  item.discount = 1969.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackSlaOverrideRequiredChannelRule flags a blank channel", () => {
  const rule = new FallbackSlaOverrideRequiredChannelRule("fallback sla override needs an entry");
  const item = newFallbackSlaOverride("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackSlaOverrideSourceLengthRule flags a long source", () => {
  const rule = new FallbackSlaOverrideSourceLengthRule(1000);
  const item = newFallbackSlaOverride("x", "y");
  item.source = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackSlaOverrideRequiredSourceRule flags a blank source", () => {
  const rule = new FallbackSlaOverrideRequiredSourceRule("fallback sla override needs an entry");
  const item = newFallbackSlaOverride("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
