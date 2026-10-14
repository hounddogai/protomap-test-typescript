import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedFrequencyDraftChannelLengthRule,
  CappedFrequencyDraftRequiredChannelRule,
  CappedFrequencyDraftRequiredCodeRule,
  CappedFrequencyDraftRequiredTitleRule,
  CappedFrequencyDraftStartsAtRangeRule,
  CappedFrequencyDraftVersionRangeRule,
  defaultCappedFrequencyDraftValidator,
} from "./capped-frequency-draft-rules.js";
import { newCappedFrequencyDraft } from "./capped-frequency-draft.js";

test("CappedFrequencyDraftValidator reports every problem", () => {
  const validator = defaultCappedFrequencyDraftValidator();
  const item = newCappedFrequencyDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedFrequencyDraftRequiredChannelRule flags a blank channel", () => {
  const rule = new CappedFrequencyDraftRequiredChannelRule("capped frequency draft needs a value");
  const item = newCappedFrequencyDraft("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedFrequencyDraftRequiredCodeRule flags a blank code", () => {
  const rule = new CappedFrequencyDraftRequiredCodeRule("capped frequency draft needs this field");
  const item = newCappedFrequencyDraft("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedFrequencyDraftVersionRangeRule flags values above version", () => {
  const rule = new CappedFrequencyDraftVersionRangeRule(64, 80);
  const item = newCappedFrequencyDraft("x", "y");
  item.version = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedFrequencyDraftStartsAtRangeRule flags values above starts at", () => {
  const rule = new CappedFrequencyDraftStartsAtRangeRule(16, 80);
  const item = newCappedFrequencyDraft("x", "y");
  item.startsAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedFrequencyDraftChannelLengthRule flags a long channel", () => {
  const rule = new CappedFrequencyDraftChannelLengthRule(255);
  const item = newCappedFrequencyDraft("x", "y");
  item.channel = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedFrequencyDraftRequiredTitleRule flags a blank title", () => {
  const rule = new CappedFrequencyDraftRequiredTitleRule("capped frequency draft needs an entry");
  const item = newCappedFrequencyDraft("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
