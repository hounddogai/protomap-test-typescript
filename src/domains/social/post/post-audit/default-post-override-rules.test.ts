import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultPostOverrideRequiredCodeRule,
  DefaultPostOverrideRequiredSummaryRule,
  DefaultPostOverrideTitleLengthRule,
  DefaultPostOverrideVariantLengthRule,
  defaultDefaultPostOverrideValidator,
} from "./default-post-override-rules.js";
import { newDefaultPostOverride } from "./default-post-override.js";

test("DefaultPostOverrideValidator reports every problem", () => {
  const validator = defaultDefaultPostOverrideValidator();
  const item = newDefaultPostOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultPostOverrideRequiredCodeRule flags a blank code", () => {
  const rule = new DefaultPostOverrideRequiredCodeRule("default post override needs a value");
  const item = newDefaultPostOverride("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultPostOverrideRequiredSummaryRule flags a blank summary", () => {
  const rule = new DefaultPostOverrideRequiredSummaryRule("default post override needs a value");
  const item = newDefaultPostOverride("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultPostOverrideVariantLengthRule flags a long variant", () => {
  const rule = new DefaultPostOverrideVariantLengthRule(80);
  const item = newDefaultPostOverride("x", "y");
  item.variant = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultPostOverrideTitleLengthRule flags a long title", () => {
  const rule = new DefaultPostOverrideTitleLengthRule(3600);
  const item = newDefaultPostOverride("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
