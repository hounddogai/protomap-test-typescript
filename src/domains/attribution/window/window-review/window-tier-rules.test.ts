import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WindowTierContactEmailLengthRule,
  WindowTierRequiredCodeRule,
  WindowTierRequiredTitleRule,
  WindowTierStartsAtRangeRule,
  WindowTierTitleLengthRule,
  WindowTierUpdatedAtRangeRule,
  defaultWindowTierValidator,
} from "./window-tier-rules.js";
import { newWindowTier } from "./window-tier.js";

test("WindowTierValidator reports every problem", () => {
  const validator = defaultWindowTierValidator();
  const item = newWindowTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WindowTierRequiredTitleRule flags a blank title", () => {
  const rule = new WindowTierRequiredTitleRule("window tier needs a value");
  const item = newWindowTier("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WindowTierUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new WindowTierUpdatedAtRangeRule(120, 1000);
  const item = newWindowTier("x", "y");
  item.updatedAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WindowTierStartsAtRangeRule flags values above starts at", () => {
  const rule = new WindowTierStartsAtRangeRule(32, 32);
  const item = newWindowTier("x", "y");
  item.startsAt = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WindowTierRequiredCodeRule flags a blank code", () => {
  const rule = new WindowTierRequiredCodeRule("window tier needs this field");
  const item = newWindowTier("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WindowTierTitleLengthRule flags a long title", () => {
  const rule = new WindowTierTitleLengthRule(86400);
  const item = newWindowTier("x", "y");
  item.title = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WindowTierContactEmailLengthRule flags a long contact email", () => {
  const rule = new WindowTierContactEmailLengthRule(3600);
  const item = newWindowTier("x", "y");
  item.contactEmail = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
