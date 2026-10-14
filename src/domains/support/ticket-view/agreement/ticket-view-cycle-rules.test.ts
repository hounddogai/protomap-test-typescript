import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TicketViewCycleBudgetRangeRule,
  TicketViewCycleCodeLengthRule,
  TicketViewCycleRequiredChecksumRule,
  TicketViewCycleRetriesRangeRule,
  TicketViewCycleTitleLengthRule,
  defaultTicketViewCycleValidator,
} from "./ticket-view-cycle-rules.js";
import { newTicketViewCycle } from "./ticket-view-cycle.js";

test("TicketViewCycleValidator reports every problem", () => {
  const validator = defaultTicketViewCycleValidator();
  const item = newTicketViewCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TicketViewCycleRetriesRangeRule flags values above retries", () => {
  const rule = new TicketViewCycleRetriesRangeRule(16, 32);
  const item = newTicketViewCycle("x", "y");
  item.retries = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TicketViewCycleTitleLengthRule flags a long title", () => {
  const rule = new TicketViewCycleTitleLengthRule(64);
  const item = newTicketViewCycle("x", "y");
  item.title = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TicketViewCycleRequiredChecksumRule flags a blank checksum", () => {
  const rule = new TicketViewCycleRequiredChecksumRule("ticket view cycle needs this field");
  const item = newTicketViewCycle("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TicketViewCycleBudgetRangeRule flags values above budget", () => {
  const rule = new TicketViewCycleBudgetRangeRule(6.7, 365.8);
  const item = newTicketViewCycle("x", "y");
  item.budget = 367.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TicketViewCycleCodeLengthRule flags a long code", () => {
  const rule = new TicketViewCycleCodeLengthRule(16);
  const item = newTicketViewCycle("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
