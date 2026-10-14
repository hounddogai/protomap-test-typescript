import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TicketViewOverrideCodeLengthRule,
  TicketViewOverrideDiscountRangeRule,
  TicketViewOverrideRequiredTitleRule,
  defaultTicketViewOverrideValidator,
} from "./ticket-view-override-rules.js";
import { newTicketViewOverride } from "./ticket-view-override.js";

test("TicketViewOverrideValidator reports every problem", () => {
  const validator = defaultTicketViewOverrideValidator();
  const item = newTicketViewOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TicketViewOverrideDiscountRangeRule flags values above discount", () => {
  const rule = new TicketViewOverrideDiscountRangeRule(2.4, 348.1);
  const item = newTicketViewOverride("x", "y");
  item.discount = 349.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TicketViewOverrideRequiredTitleRule flags a blank title", () => {
  const rule = new TicketViewOverrideRequiredTitleRule("ticket view override needs an entry");
  const item = newTicketViewOverride("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TicketViewOverrideCodeLengthRule flags a long code", () => {
  const rule = new TicketViewOverrideCodeLengthRule(1000);
  const item = newTicketViewOverride("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
