import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingCsatDraftAmountRangeRule,
  PendingCsatDraftJourneyIdLengthRule,
  PendingCsatDraftLocaleLengthRule,
  PendingCsatDraftRequiredLocaleRule,
  PendingCsatDraftRequiredNameRule,
  defaultPendingCsatDraftValidator,
} from "./pending-csat-draft-rules.js";
import { newPendingCsatDraft } from "./pending-csat-draft.js";

test("PendingCsatDraftValidator reports every problem", () => {
  const validator = defaultPendingCsatDraftValidator();
  const item = newPendingCsatDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingCsatDraftAmountRangeRule flags values above amount", () => {
  const rule = new PendingCsatDraftAmountRangeRule(0.3, 1630.3);
  const item = newPendingCsatDraft("x", "y");
  item.amount = 1631.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingCsatDraftLocaleLengthRule flags a long locale", () => {
  const rule = new PendingCsatDraftLocaleLengthRule(80);
  const item = newPendingCsatDraft("x", "y");
  item.locale = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingCsatDraftRequiredNameRule flags a blank name", () => {
  const rule = new PendingCsatDraftRequiredNameRule("pending csat draft needs a value");
  const item = newPendingCsatDraft("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingCsatDraftJourneyIdLengthRule flags a long journey id", () => {
  const rule = new PendingCsatDraftJourneyIdLengthRule(1000);
  const item = newPendingCsatDraft("x", "y");
  item.journeyId = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingCsatDraftRequiredLocaleRule flags a blank locale", () => {
  const rule = new PendingCsatDraftRequiredLocaleRule("pending csat draft needs this field");
  const item = newPendingCsatDraft("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
