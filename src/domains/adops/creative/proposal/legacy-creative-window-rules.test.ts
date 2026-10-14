import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyCreativeWindowCodeLengthRule,
  LegacyCreativeWindowCountryLengthRule,
  LegacyCreativeWindowRequiredLabelRule,
  LegacyCreativeWindowWindowDaysRangeRule,
  defaultLegacyCreativeWindowValidator,
} from "./legacy-creative-window-rules.js";
import { newLegacyCreativeWindow } from "./legacy-creative-window.js";

test("LegacyCreativeWindowValidator reports every problem", () => {
  const validator = defaultLegacyCreativeWindowValidator();
  const item = newLegacyCreativeWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyCreativeWindowRequiredLabelRule flags a blank label", () => {
  const rule = new LegacyCreativeWindowRequiredLabelRule("legacy creative window needs a value");
  const item = newLegacyCreativeWindow("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyCreativeWindowCodeLengthRule flags a long code", () => {
  const rule = new LegacyCreativeWindowCodeLengthRule(120);
  const item = newLegacyCreativeWindow("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyCreativeWindowWindowDaysRangeRule flags values above window days", () => {
  const rule = new LegacyCreativeWindowWindowDaysRangeRule(16, 86400);
  const item = newLegacyCreativeWindow("x", "y");
  item.windowDays = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyCreativeWindowCountryLengthRule flags a long country", () => {
  const rule = new LegacyCreativeWindowCountryLengthRule(80);
  const item = newLegacyCreativeWindow("x", "y");
  item.country = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
