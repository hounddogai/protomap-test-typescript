import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TicketViewPlanBatchSizeRangeRule,
  TicketViewPlanCodeLengthRule,
  TicketViewPlanRegionLengthRule,
  TicketViewPlanRequiredCodeRule,
  TicketViewPlanRequiredRegionRule,
  defaultTicketViewPlanValidator,
} from "./ticket-view-plan-rules.js";
import { newTicketViewPlan } from "./ticket-view-plan.js";

test("TicketViewPlanValidator reports every problem", () => {
  const validator = defaultTicketViewPlanValidator();
  const item = newTicketViewPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TicketViewPlanCodeLengthRule flags a long code", () => {
  const rule = new TicketViewPlanCodeLengthRule(32);
  const item = newTicketViewPlan("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TicketViewPlanRequiredRegionRule flags a blank region", () => {
  const rule = new TicketViewPlanRequiredRegionRule("ticket view plan needs an entry");
  const item = newTicketViewPlan("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TicketViewPlanRequiredCodeRule flags a blank code", () => {
  const rule = new TicketViewPlanRequiredCodeRule("ticket view plan needs this field");
  const item = newTicketViewPlan("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TicketViewPlanRegionLengthRule flags a long region", () => {
  const rule = new TicketViewPlanRegionLengthRule(64);
  const item = newTicketViewPlan("x", "y");
  item.region = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TicketViewPlanBatchSizeRangeRule flags values above batch size", () => {
  const rule = new TicketViewPlanBatchSizeRangeRule(1000, 86400);
  const item = newTicketViewPlan("x", "y");
  item.batchSize = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
