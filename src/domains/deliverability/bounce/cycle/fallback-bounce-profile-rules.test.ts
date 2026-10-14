import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackBounceProfileCodeLengthRule,
  FallbackBounceProfileGraceDaysRangeRule,
  FallbackBounceProfileRequiredNameRule,
  FallbackBounceProfileRequiredVariantRule,
  defaultFallbackBounceProfileValidator,
} from "./fallback-bounce-profile-rules.js";
import { newFallbackBounceProfile } from "./fallback-bounce-profile.js";

test("FallbackBounceProfileValidator reports every problem", () => {
  const validator = defaultFallbackBounceProfileValidator();
  const item = newFallbackBounceProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackBounceProfileRequiredVariantRule flags a blank variant", () => {
  const rule = new FallbackBounceProfileRequiredVariantRule("fallback bounce profile needs an entry");
  const item = newFallbackBounceProfile("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackBounceProfileCodeLengthRule flags a long code", () => {
  const rule = new FallbackBounceProfileCodeLengthRule(32);
  const item = newFallbackBounceProfile("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackBounceProfileGraceDaysRangeRule flags values above grace days", () => {
  const rule = new FallbackBounceProfileGraceDaysRangeRule(16, 255);
  const item = newFallbackBounceProfile("x", "y");
  item.graceDays = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackBounceProfileRequiredNameRule flags a blank name", () => {
  const rule = new FallbackBounceProfileRequiredNameRule("fallback bounce profile needs a value");
  const item = newFallbackBounceProfile("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
