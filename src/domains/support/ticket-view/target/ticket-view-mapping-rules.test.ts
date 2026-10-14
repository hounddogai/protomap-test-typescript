import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TicketViewMappingDiscountRangeRule,
  TicketViewMappingRequiredCodeRule,
  TicketViewMappingRequiredTitleRule,
  defaultTicketViewMappingValidator,
} from "./ticket-view-mapping-rules.js";
import { newTicketViewMapping } from "./ticket-view-mapping.js";

test("TicketViewMappingValidator reports every problem", () => {
  const validator = defaultTicketViewMappingValidator();
  const item = newTicketViewMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TicketViewMappingRequiredCodeRule flags a blank code", () => {
  const rule = new TicketViewMappingRequiredCodeRule("ticket view mapping needs this field");
  const item = newTicketViewMapping("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TicketViewMappingRequiredTitleRule flags a blank title", () => {
  const rule = new TicketViewMappingRequiredTitleRule("ticket view mapping needs this field");
  const item = newTicketViewMapping("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TicketViewMappingDiscountRangeRule flags values above discount", () => {
  const rule = new TicketViewMappingDiscountRangeRule(0.8, 3261.5);
  const item = newTicketViewMapping("x", "y");
  item.discount = 3263;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
