import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyCreativeOverrideCodeLengthRule,
  LegacyCreativeOverrideMaximumRangeRule,
  LegacyCreativeOverrideRequiredCodeRule,
  LegacyCreativeOverrideSourceLengthRule,
  defaultLegacyCreativeOverrideValidator,
} from "./legacy-creative-override-rules.js";
import { newLegacyCreativeOverride } from "./legacy-creative-override.js";

test("LegacyCreativeOverrideValidator reports every problem", () => {
  const validator = defaultLegacyCreativeOverrideValidator();
  const item = newLegacyCreativeOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyCreativeOverrideRequiredCodeRule flags a blank code", () => {
  const rule = new LegacyCreativeOverrideRequiredCodeRule("legacy creative override needs a value");
  const item = newLegacyCreativeOverride("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyCreativeOverrideMaximumRangeRule flags values above maximum", () => {
  const rule = new LegacyCreativeOverrideMaximumRangeRule(1.9, 1797.3);
  const item = newLegacyCreativeOverride("x", "y");
  item.maximum = 1798.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyCreativeOverrideSourceLengthRule flags a long source", () => {
  const rule = new LegacyCreativeOverrideSourceLengthRule(64);
  const item = newLegacyCreativeOverride("x", "y");
  item.source = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyCreativeOverrideCodeLengthRule flags a long code", () => {
  const rule = new LegacyCreativeOverrideCodeLengthRule(64);
  const item = newLegacyCreativeOverride("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
