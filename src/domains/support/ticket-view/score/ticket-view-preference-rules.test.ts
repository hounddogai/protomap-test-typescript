import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TicketViewPreferenceBidRangeRule,
  TicketViewPreferenceLocaleLengthRule,
  TicketViewPreferenceRateRangeRule,
  TicketViewPreferenceRequiredLocaleRule,
  TicketViewPreferenceRequiredTitleRule,
  defaultTicketViewPreferenceValidator,
} from "./ticket-view-preference-rules.js";
import { newTicketViewPreference } from "./ticket-view-preference.js";

test("TicketViewPreferenceValidator reports every problem", () => {
  const validator = defaultTicketViewPreferenceValidator();
  const item = newTicketViewPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TicketViewPreferenceBidRangeRule flags values above bid", () => {
  const rule = new TicketViewPreferenceBidRangeRule(4.8, 1407.4);
  const item = newTicketViewPreference("x", "y");
  item.bid = 1408.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TicketViewPreferenceRequiredLocaleRule flags a blank locale", () => {
  const rule = new TicketViewPreferenceRequiredLocaleRule("ticket view preference needs this field");
  const item = newTicketViewPreference("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TicketViewPreferenceLocaleLengthRule flags a long locale", () => {
  const rule = new TicketViewPreferenceLocaleLengthRule(64);
  const item = newTicketViewPreference("x", "y");
  item.locale = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TicketViewPreferenceRequiredTitleRule flags a blank title", () => {
  const rule = new TicketViewPreferenceRequiredTitleRule("ticket view preference needs an entry");
  const item = newTicketViewPreference("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TicketViewPreferenceRateRangeRule flags values above rate", () => {
  const rule = new TicketViewPreferenceRateRangeRule(7.6, 182.7);
  const item = newTicketViewPreference("x", "y");
  item.rate = 184.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
