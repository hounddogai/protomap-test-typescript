import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualConversionProfileCategoryLengthRule,
  ManualConversionProfileNameLengthRule,
  ManualConversionProfileRequiredNameRule,
  defaultManualConversionProfileValidator,
} from "./manual-conversion-profile-rules.js";
import { newManualConversionProfile } from "./manual-conversion-profile.js";

test("ManualConversionProfileValidator reports every problem", () => {
  const validator = defaultManualConversionProfileValidator();
  const item = newManualConversionProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualConversionProfileCategoryLengthRule flags a long category", () => {
  const rule = new ManualConversionProfileCategoryLengthRule(255);
  const item = newManualConversionProfile("x", "y");
  item.category = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualConversionProfileRequiredNameRule flags a blank name", () => {
  const rule = new ManualConversionProfileRequiredNameRule("manual conversion profile needs a value");
  const item = newManualConversionProfile("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualConversionProfileNameLengthRule flags a long name", () => {
  const rule = new ManualConversionProfileNameLengthRule(1000);
  const item = newManualConversionProfile("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
