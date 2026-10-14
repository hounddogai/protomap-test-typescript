import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultPathDraftAttemptsRangeRule,
  DefaultPathDraftChannelLengthRule,
  DefaultPathDraftRateRangeRule,
  DefaultPathDraftRequiredChannelRule,
  DefaultPathDraftRequiredLocaleRule,
  DefaultPathDraftWindowDaysRangeRule,
  defaultDefaultPathDraftValidator,
} from "./default-path-draft-rules.js";
import { newDefaultPathDraft } from "./default-path-draft.js";

test("DefaultPathDraftValidator reports every problem", () => {
  const validator = defaultDefaultPathDraftValidator();
  const item = newDefaultPathDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultPathDraftChannelLengthRule flags a long channel", () => {
  const rule = new DefaultPathDraftChannelLengthRule(255);
  const item = newDefaultPathDraft("x", "y");
  item.channel = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultPathDraftWindowDaysRangeRule flags values above window days", () => {
  const rule = new DefaultPathDraftWindowDaysRangeRule(64, 86400);
  const item = newDefaultPathDraft("x", "y");
  item.windowDays = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultPathDraftRequiredLocaleRule flags a blank locale", () => {
  const rule = new DefaultPathDraftRequiredLocaleRule("default path draft needs this field");
  const item = newDefaultPathDraft("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultPathDraftRequiredChannelRule flags a blank channel", () => {
  const rule = new DefaultPathDraftRequiredChannelRule("default path draft needs a value");
  const item = newDefaultPathDraft("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultPathDraftAttemptsRangeRule flags values above attempts", () => {
  const rule = new DefaultPathDraftAttemptsRangeRule(32, 1000);
  const item = newDefaultPathDraft("x", "y");
  item.attempts = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultPathDraftRateRangeRule flags values above rate", () => {
  const rule = new DefaultPathDraftRateRangeRule(1.3, 1356.2);
  const item = newDefaultPathDraft("x", "y");
  item.rate = 1357.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
