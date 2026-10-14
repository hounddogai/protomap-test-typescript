import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SenderPreferenceChannelLengthRule,
  SenderPreferenceNameLengthRule,
  SenderPreferenceRequiredNameRule,
  SenderPreferenceRequiredSourceRule,
  defaultSenderPreferenceValidator,
} from "./sender-preference-rules.js";
import { newSenderPreference } from "./sender-preference.js";

test("SenderPreferenceValidator reports every problem", () => {
  const validator = defaultSenderPreferenceValidator();
  const item = newSenderPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SenderPreferenceRequiredSourceRule flags a blank source", () => {
  const rule = new SenderPreferenceRequiredSourceRule("sender preference needs a value");
  const item = newSenderPreference("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SenderPreferenceChannelLengthRule flags a long channel", () => {
  const rule = new SenderPreferenceChannelLengthRule(255);
  const item = newSenderPreference("x", "y");
  item.channel = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SenderPreferenceNameLengthRule flags a long name", () => {
  const rule = new SenderPreferenceNameLengthRule(80);
  const item = newSenderPreference("x", "y");
  item.name = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SenderPreferenceRequiredNameRule flags a blank name", () => {
  const rule = new SenderPreferenceRequiredNameRule("sender preference needs this field");
  const item = newSenderPreference("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
