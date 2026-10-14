import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalRewardEntryClicksRangeRule,
  GlobalRewardEntryCodeLengthRule,
  GlobalRewardEntryEndsAtRangeRule,
  GlobalRewardEntryLocaleLengthRule,
  GlobalRewardEntryRequiredLocaleRule,
  GlobalRewardEntryVariantLengthRule,
  defaultGlobalRewardEntryValidator,
} from "./global-reward-entry-rules.js";
import { newGlobalRewardEntry } from "./global-reward-entry.js";

test("GlobalRewardEntryValidator reports every problem", () => {
  const validator = defaultGlobalRewardEntryValidator();
  const item = newGlobalRewardEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalRewardEntryCodeLengthRule flags a long code", () => {
  const rule = new GlobalRewardEntryCodeLengthRule(64);
  const item = newGlobalRewardEntry("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalRewardEntryClicksRangeRule flags values above clicks", () => {
  const rule = new GlobalRewardEntryClicksRangeRule(16, 3600);
  const item = newGlobalRewardEntry("x", "y");
  item.clicks = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalRewardEntryVariantLengthRule flags a long variant", () => {
  const rule = new GlobalRewardEntryVariantLengthRule(255);
  const item = newGlobalRewardEntry("x", "y");
  item.variant = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalRewardEntryRequiredLocaleRule flags a blank locale", () => {
  const rule = new GlobalRewardEntryRequiredLocaleRule("global reward entry needs a value");
  const item = newGlobalRewardEntry("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalRewardEntryLocaleLengthRule flags a long locale", () => {
  const rule = new GlobalRewardEntryLocaleLengthRule(255);
  const item = newGlobalRewardEntry("x", "y");
  item.locale = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalRewardEntryEndsAtRangeRule flags values above ends at", () => {
  const rule = new GlobalRewardEntryEndsAtRangeRule(64, 255);
  const item = newGlobalRewardEntry("x", "y");
  item.endsAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
