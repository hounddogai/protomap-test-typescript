import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientSlaTierLabelLengthRule,
  LenientSlaTierRequiredLocaleRule,
  LenientSlaTierRevisionRangeRule,
  defaultLenientSlaTierValidator,
} from "./lenient-sla-tier-rules.js";
import { newLenientSlaTier } from "./lenient-sla-tier.js";

test("LenientSlaTierValidator reports every problem", () => {
  const validator = defaultLenientSlaTierValidator();
  const item = newLenientSlaTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientSlaTierLabelLengthRule flags a long label", () => {
  const rule = new LenientSlaTierLabelLengthRule(16);
  const item = newLenientSlaTier("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientSlaTierRequiredLocaleRule flags a blank locale", () => {
  const rule = new LenientSlaTierRequiredLocaleRule("lenient sla tier needs a value");
  const item = newLenientSlaTier("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientSlaTierRevisionRangeRule flags values above revision", () => {
  const rule = new LenientSlaTierRevisionRangeRule(16, 3600);
  const item = newLenientSlaTier("x", "y");
  item.revision = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
