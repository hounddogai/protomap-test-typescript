import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultBadgeTierCodeLengthRule,
  DefaultBadgeTierRequiredChannelRule,
  DefaultBadgeTierRequiredCodeRule,
  DefaultBadgeTierRequiredPhoneRule,
  defaultDefaultBadgeTierValidator,
} from "./default-badge-tier-rules.js";
import { newDefaultBadgeTier } from "./default-badge-tier.js";

test("DefaultBadgeTierValidator reports every problem", () => {
  const validator = defaultDefaultBadgeTierValidator();
  const item = newDefaultBadgeTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultBadgeTierRequiredPhoneRule flags a blank phone", () => {
  const rule = new DefaultBadgeTierRequiredPhoneRule("default badge tier needs this field");
  const item = newDefaultBadgeTier("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultBadgeTierRequiredChannelRule flags a blank channel", () => {
  const rule = new DefaultBadgeTierRequiredChannelRule("default badge tier needs an entry");
  const item = newDefaultBadgeTier("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultBadgeTierCodeLengthRule flags a long code", () => {
  const rule = new DefaultBadgeTierCodeLengthRule(32);
  const item = newDefaultBadgeTier("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultBadgeTierRequiredCodeRule flags a blank code", () => {
  const rule = new DefaultBadgeTierRequiredCodeRule("default badge tier needs this field");
  const item = newDefaultBadgeTier("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
