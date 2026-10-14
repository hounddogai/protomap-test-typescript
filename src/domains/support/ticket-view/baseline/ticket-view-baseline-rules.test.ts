import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TicketViewBaselineBidRangeRule,
  TicketViewBaselineCostRangeRule,
  TicketViewBaselineLabelLengthRule,
  TicketViewBaselineRequiredCodeRule,
  TicketViewBaselineRequiredLabelRule,
  TicketViewBaselineUtmSourceLengthRule,
  defaultTicketViewBaselineValidator,
} from "./ticket-view-baseline-rules.js";
import { newTicketViewBaseline } from "./ticket-view-baseline.js";

test("TicketViewBaselineValidator reports every problem", () => {
  const validator = defaultTicketViewBaselineValidator();
  const item = newTicketViewBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TicketViewBaselineLabelLengthRule flags a long label", () => {
  const rule = new TicketViewBaselineLabelLengthRule(1000);
  const item = newTicketViewBaseline("x", "y");
  item.label = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TicketViewBaselineBidRangeRule flags values above bid", () => {
  const rule = new TicketViewBaselineBidRangeRule(4.2, 1146.7);
  const item = newTicketViewBaseline("x", "y");
  item.bid = 1148.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TicketViewBaselineCostRangeRule flags values above cost", () => {
  const rule = new TicketViewBaselineCostRangeRule(7.7, 2816.7);
  const item = newTicketViewBaseline("x", "y");
  item.cost = 2818.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TicketViewBaselineRequiredCodeRule flags a blank code", () => {
  const rule = new TicketViewBaselineRequiredCodeRule("ticket view baseline needs this field");
  const item = newTicketViewBaseline("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TicketViewBaselineUtmSourceLengthRule flags a long utm source", () => {
  const rule = new TicketViewBaselineUtmSourceLengthRule(32);
  const item = newTicketViewBaseline("x", "y");
  item.utmSource = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TicketViewBaselineRequiredLabelRule flags a blank label", () => {
  const rule = new TicketViewBaselineRequiredLabelRule("ticket view baseline needs a value");
  const item = newTicketViewBaseline("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
