import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedNudgeEntryCodeLengthRule,
  CappedNudgeEntryCountryLengthRule,
  CappedNudgeEntryLabelLengthRule,
  CappedNudgeEntryRequiredChannelRule,
  defaultCappedNudgeEntryValidator,
} from "./capped-nudge-entry-rules.js";
import { newCappedNudgeEntry } from "./capped-nudge-entry.js";

test("CappedNudgeEntryValidator reports every problem", () => {
  const validator = defaultCappedNudgeEntryValidator();
  const item = newCappedNudgeEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedNudgeEntryCodeLengthRule flags a long code", () => {
  const rule = new CappedNudgeEntryCodeLengthRule(16);
  const item = newCappedNudgeEntry("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedNudgeEntryRequiredChannelRule flags a blank channel", () => {
  const rule = new CappedNudgeEntryRequiredChannelRule("capped nudge entry needs an entry");
  const item = newCappedNudgeEntry("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedNudgeEntryLabelLengthRule flags a long label", () => {
  const rule = new CappedNudgeEntryLabelLengthRule(255);
  const item = newCappedNudgeEntry("x", "y");
  item.label = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedNudgeEntryCountryLengthRule flags a long country", () => {
  const rule = new CappedNudgeEntryCountryLengthRule(3600);
  const item = newCappedNudgeEntry("x", "y");
  item.country = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
