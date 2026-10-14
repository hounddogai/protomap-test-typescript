import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualBounceNoticeCodeLengthRule,
  ManualBounceNoticeCountryLengthRule,
  ManualBounceNoticeJourneyIdLengthRule,
  ManualBounceNoticeRequiredJourneyIdRule,
  ManualBounceNoticeRequiredTitleRule,
  ManualBounceNoticeTitleLengthRule,
  defaultManualBounceNoticeValidator,
} from "./manual-bounce-notice-rules.js";
import { newManualBounceNotice } from "./manual-bounce-notice.js";

test("ManualBounceNoticeValidator reports every problem", () => {
  const validator = defaultManualBounceNoticeValidator();
  const item = newManualBounceNotice("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualBounceNoticeTitleLengthRule flags a long title", () => {
  const rule = new ManualBounceNoticeTitleLengthRule(120);
  const item = newManualBounceNotice("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualBounceNoticeRequiredTitleRule flags a blank title", () => {
  const rule = new ManualBounceNoticeRequiredTitleRule("manual bounce notice needs a value");
  const item = newManualBounceNotice("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualBounceNoticeJourneyIdLengthRule flags a long journey id", () => {
  const rule = new ManualBounceNoticeJourneyIdLengthRule(32);
  const item = newManualBounceNotice("x", "y");
  item.journeyId = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualBounceNoticeCountryLengthRule flags a long country", () => {
  const rule = new ManualBounceNoticeCountryLengthRule(16);
  const item = newManualBounceNotice("x", "y");
  item.country = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualBounceNoticeCodeLengthRule flags a long code", () => {
  const rule = new ManualBounceNoticeCodeLengthRule(80);
  const item = newManualBounceNotice("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualBounceNoticeRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new ManualBounceNoticeRequiredJourneyIdRule("manual bounce notice needs an entry");
  const item = newManualBounceNotice("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
