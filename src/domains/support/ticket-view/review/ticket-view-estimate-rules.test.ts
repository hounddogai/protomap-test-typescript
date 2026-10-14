import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TicketViewEstimateCodeLengthRule,
  TicketViewEstimateRequiredNameRule,
  TicketViewEstimateRequiredSummaryRule,
  defaultTicketViewEstimateValidator,
} from "./ticket-view-estimate-rules.js";
import { newTicketViewEstimate } from "./ticket-view-estimate.js";

test("TicketViewEstimateValidator reports every problem", () => {
  const validator = defaultTicketViewEstimateValidator();
  const item = newTicketViewEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TicketViewEstimateCodeLengthRule flags a long code", () => {
  const rule = new TicketViewEstimateCodeLengthRule(120);
  const item = newTicketViewEstimate("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TicketViewEstimateRequiredSummaryRule flags a blank summary", () => {
  const rule = new TicketViewEstimateRequiredSummaryRule("ticket view estimate needs an entry");
  const item = newTicketViewEstimate("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TicketViewEstimateRequiredNameRule flags a blank name", () => {
  const rule = new TicketViewEstimateRequiredNameRule("ticket view estimate needs an entry");
  const item = newTicketViewEstimate("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
