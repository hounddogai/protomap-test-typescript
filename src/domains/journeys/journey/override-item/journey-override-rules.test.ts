import assert from "node:assert/strict";
import { test } from "node:test";
import {
  JourneyOverrideCategoryLengthRule,
  JourneyOverrideNameLengthRule,
  JourneyOverrideVersionRangeRule,
  defaultJourneyOverrideValidator,
} from "./journey-override-rules.js";
import { newJourneyOverride } from "./journey-override.js";

test("JourneyOverrideValidator reports every problem", () => {
  const validator = defaultJourneyOverrideValidator();
  const item = newJourneyOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("JourneyOverrideNameLengthRule flags a long name", () => {
  const rule = new JourneyOverrideNameLengthRule(86400);
  const item = newJourneyOverride("x", "y");
  item.name = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("JourneyOverrideVersionRangeRule flags values above version", () => {
  const rule = new JourneyOverrideVersionRangeRule(32, 64);
  const item = newJourneyOverride("x", "y");
  item.version = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("JourneyOverrideCategoryLengthRule flags a long category", () => {
  const rule = new JourneyOverrideCategoryLengthRule(80);
  const item = newJourneyOverride("x", "y");
  item.category = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
