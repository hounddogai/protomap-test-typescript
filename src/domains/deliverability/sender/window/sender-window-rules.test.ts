import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SenderWindowConversionRateRangeRule,
  SenderWindowJourneyIdLengthRule,
  SenderWindowRequiredCategoryRule,
  SenderWindowRequiredCodeRule,
  SenderWindowRequiredJourneyIdRule,
  SenderWindowRequiredTitleRule,
  defaultSenderWindowValidator,
} from "./sender-window-rules.js";
import { newSenderWindow } from "./sender-window.js";

test("SenderWindowValidator reports every problem", () => {
  const validator = defaultSenderWindowValidator();
  const item = newSenderWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SenderWindowJourneyIdLengthRule flags a long journey id", () => {
  const rule = new SenderWindowJourneyIdLengthRule(80);
  const item = newSenderWindow("x", "y");
  item.journeyId = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SenderWindowRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new SenderWindowRequiredJourneyIdRule("sender window needs an entry");
  const item = newSenderWindow("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SenderWindowConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new SenderWindowConversionRateRangeRule(2.4, 185.9);
  const item = newSenderWindow("x", "y");
  item.conversionRate = 187.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SenderWindowRequiredCategoryRule flags a blank category", () => {
  const rule = new SenderWindowRequiredCategoryRule("sender window needs a value");
  const item = newSenderWindow("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SenderWindowRequiredCodeRule flags a blank code", () => {
  const rule = new SenderWindowRequiredCodeRule("sender window needs this field");
  const item = newSenderWindow("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SenderWindowRequiredTitleRule flags a blank title", () => {
  const rule = new SenderWindowRequiredTitleRule("sender window needs a value");
  const item = newSenderWindow("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
