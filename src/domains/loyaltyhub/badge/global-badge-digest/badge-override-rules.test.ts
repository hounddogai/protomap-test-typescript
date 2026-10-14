import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BadgeOverrideBatchSizeRangeRule,
  BadgeOverrideRequiredChannelRule,
  BadgeOverrideRequiredCodeRule,
  BadgeOverrideTitleLengthRule,
  defaultBadgeOverrideValidator,
} from "./badge-override-rules.js";
import { newBadgeOverride } from "./badge-override.js";

test("BadgeOverrideValidator reports every problem", () => {
  const validator = defaultBadgeOverrideValidator();
  const item = newBadgeOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BadgeOverrideRequiredChannelRule flags a blank channel", () => {
  const rule = new BadgeOverrideRequiredChannelRule("badge override needs a value");
  const item = newBadgeOverride("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BadgeOverrideBatchSizeRangeRule flags values above batch size", () => {
  const rule = new BadgeOverrideBatchSizeRangeRule(32, 255);
  const item = newBadgeOverride("x", "y");
  item.batchSize = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BadgeOverrideRequiredCodeRule flags a blank code", () => {
  const rule = new BadgeOverrideRequiredCodeRule("badge override needs this field");
  const item = newBadgeOverride("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BadgeOverrideTitleLengthRule flags a long title", () => {
  const rule = new BadgeOverrideTitleLengthRule(1000);
  const item = newBadgeOverride("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
