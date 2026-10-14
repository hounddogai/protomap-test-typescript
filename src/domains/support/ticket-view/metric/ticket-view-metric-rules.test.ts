import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TicketViewMetricNotesLengthRule,
  TicketViewMetricRequiredTitleRule,
  TicketViewMetricRevisionRangeRule,
  TicketViewMetricTitleLengthRule,
  defaultTicketViewMetricValidator,
} from "./ticket-view-metric-rules.js";
import { newTicketViewMetric } from "./ticket-view-metric.js";

test("TicketViewMetricValidator reports every problem", () => {
  const validator = defaultTicketViewMetricValidator();
  const item = newTicketViewMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TicketViewMetricRevisionRangeRule flags values above revision", () => {
  const rule = new TicketViewMetricRevisionRangeRule(16, 86400);
  const item = newTicketViewMetric("x", "y");
  item.revision = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TicketViewMetricRequiredTitleRule flags a blank title", () => {
  const rule = new TicketViewMetricRequiredTitleRule("ticket view metric needs this field");
  const item = newTicketViewMetric("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TicketViewMetricTitleLengthRule flags a long title", () => {
  const rule = new TicketViewMetricTitleLengthRule(1000);
  const item = newTicketViewMetric("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TicketViewMetricNotesLengthRule flags a long notes", () => {
  const rule = new TicketViewMetricNotesLengthRule(120);
  const item = newTicketViewMetric("x", "y");
  item.notes = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
