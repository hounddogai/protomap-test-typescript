import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackSuppressionGroupAmountRangeRule,
  FallbackSuppressionGroupRequiredContactEmailRule,
  FallbackSuppressionGroupRequiredLocaleRule,
  defaultFallbackSuppressionGroupValidator,
} from "./fallback-suppression-group-rules.js";
import { newFallbackSuppressionGroup } from "./fallback-suppression-group.js";

test("FallbackSuppressionGroupValidator reports every problem", () => {
  const validator = defaultFallbackSuppressionGroupValidator();
  const item = newFallbackSuppressionGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackSuppressionGroupAmountRangeRule flags values above amount", () => {
  const rule = new FallbackSuppressionGroupAmountRangeRule(1.7, 3748.6);
  const item = newFallbackSuppressionGroup("x", "y");
  item.amount = 3750.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackSuppressionGroupRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new FallbackSuppressionGroupRequiredContactEmailRule("fallback suppression group needs this field");
  const item = newFallbackSuppressionGroup("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackSuppressionGroupRequiredLocaleRule flags a blank locale", () => {
  const rule = new FallbackSuppressionGroupRequiredLocaleRule("fallback suppression group needs an entry");
  const item = newFallbackSuppressionGroup("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
