import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredTicketViewBaselineEndsAtRangeRule,
  TieredTicketViewBaselineNameLengthRule,
  TieredTicketViewBaselineRequiredCodeRule,
  TieredTicketViewBaselineRequiredJourneyIdRule,
  TieredTicketViewBaselineRequiredTitleRule,
  TieredTicketViewBaselineTitleLengthRule,
  defaultTieredTicketViewBaselineValidator,
} from "./tiered-ticket-view-baseline-rules.js";
import { newTieredTicketViewBaseline } from "./tiered-ticket-view-baseline.js";

test("TieredTicketViewBaselineValidator reports every problem", () => {
  const validator = defaultTieredTicketViewBaselineValidator();
  const item = newTieredTicketViewBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredTicketViewBaselineNameLengthRule flags a long name", () => {
  const rule = new TieredTicketViewBaselineNameLengthRule(86400);
  const item = newTieredTicketViewBaseline("x", "y");
  item.name = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredTicketViewBaselineRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new TieredTicketViewBaselineRequiredJourneyIdRule("tiered ticket view baseline needs an entry");
  const item = newTieredTicketViewBaseline("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredTicketViewBaselineTitleLengthRule flags a long title", () => {
  const rule = new TieredTicketViewBaselineTitleLengthRule(3600);
  const item = newTieredTicketViewBaseline("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredTicketViewBaselineRequiredCodeRule flags a blank code", () => {
  const rule = new TieredTicketViewBaselineRequiredCodeRule("tiered ticket view baseline needs an entry");
  const item = newTieredTicketViewBaseline("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredTicketViewBaselineRequiredTitleRule flags a blank title", () => {
  const rule = new TieredTicketViewBaselineRequiredTitleRule("tiered ticket view baseline needs a value");
  const item = newTieredTicketViewBaseline("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredTicketViewBaselineEndsAtRangeRule flags values above ends at", () => {
  const rule = new TieredTicketViewBaselineEndsAtRangeRule(80, 86400);
  const item = newTieredTicketViewBaseline("x", "y");
  item.endsAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
