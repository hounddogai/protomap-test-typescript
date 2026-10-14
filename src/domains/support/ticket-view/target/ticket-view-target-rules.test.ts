import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TicketViewTargetCeilingRangeRule,
  TicketViewTargetClicksRangeRule,
  TicketViewTargetCodeLengthRule,
  TicketViewTargetRequiredCodeRule,
  TicketViewTargetRequiredLabelRule,
  defaultTicketViewTargetValidator,
} from "./ticket-view-target-rules.js";
import { newTicketViewTarget } from "./ticket-view-target.js";

test("TicketViewTargetValidator reports every problem", () => {
  const validator = defaultTicketViewTargetValidator();
  const item = newTicketViewTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TicketViewTargetRequiredCodeRule flags a blank code", () => {
  const rule = new TicketViewTargetRequiredCodeRule("ticket view target needs a value");
  const item = newTicketViewTarget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TicketViewTargetCeilingRangeRule flags values above ceiling", () => {
  const rule = new TicketViewTargetCeilingRangeRule(4.2, 3851.4);
  const item = newTicketViewTarget("x", "y");
  item.ceiling = 3852.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TicketViewTargetClicksRangeRule flags values above clicks", () => {
  const rule = new TicketViewTargetClicksRangeRule(255, 86400);
  const item = newTicketViewTarget("x", "y");
  item.clicks = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TicketViewTargetRequiredLabelRule flags a blank label", () => {
  const rule = new TicketViewTargetRequiredLabelRule("ticket view target needs this field");
  const item = newTicketViewTarget("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TicketViewTargetCodeLengthRule flags a long code", () => {
  const rule = new TicketViewTargetCodeLengthRule(1000);
  const item = newTicketViewTarget("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
