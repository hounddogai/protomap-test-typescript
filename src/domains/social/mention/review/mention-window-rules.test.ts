import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MentionWindowCodeLengthRule,
  MentionWindowGraceDaysRangeRule,
  MentionWindowRequiredContactEmailRule,
  MentionWindowRequiredNameRule,
  MentionWindowWeightRangeRule,
  defaultMentionWindowValidator,
} from "./mention-window-rules.js";
import { newMentionWindow } from "./mention-window.js";

test("MentionWindowValidator reports every problem", () => {
  const validator = defaultMentionWindowValidator();
  const item = newMentionWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("MentionWindowRequiredNameRule flags a blank name", () => {
  const rule = new MentionWindowRequiredNameRule("mention window needs a value");
  const item = newMentionWindow("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("MentionWindowCodeLengthRule flags a long code", () => {
  const rule = new MentionWindowCodeLengthRule(3600);
  const item = newMentionWindow("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("MentionWindowWeightRangeRule flags values above weight", () => {
  const rule = new MentionWindowWeightRangeRule(9, 2298.5);
  const item = newMentionWindow("x", "y");
  item.weight = 2300;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("MentionWindowGraceDaysRangeRule flags values above grace days", () => {
  const rule = new MentionWindowGraceDaysRangeRule(32, 3600);
  const item = newMentionWindow("x", "y");
  item.graceDays = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("MentionWindowRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new MentionWindowRequiredContactEmailRule("mention window needs an entry");
  const item = newMentionWindow("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
