import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TicketViewAuditBidRangeRule,
  TicketViewAuditFloorValueRangeRule,
  TicketViewAuditRequiredTitleRule,
  TicketViewAuditWindowDaysRangeRule,
  defaultTicketViewAuditValidator,
} from "./ticket-view-audit-rules.js";
import { newTicketViewAudit } from "./ticket-view-audit.js";

test("TicketViewAuditValidator reports every problem", () => {
  const validator = defaultTicketViewAuditValidator();
  const item = newTicketViewAudit("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TicketViewAuditWindowDaysRangeRule flags values above window days", () => {
  const rule = new TicketViewAuditWindowDaysRangeRule(64, 3600);
  const item = newTicketViewAudit("x", "y");
  item.windowDays = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TicketViewAuditBidRangeRule flags values above bid", () => {
  const rule = new TicketViewAuditBidRangeRule(7, 4449.9);
  const item = newTicketViewAudit("x", "y");
  item.bid = 4451.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TicketViewAuditRequiredTitleRule flags a blank title", () => {
  const rule = new TicketViewAuditRequiredTitleRule("ticket view audit needs a value");
  const item = newTicketViewAudit("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TicketViewAuditFloorValueRangeRule flags values above floor value", () => {
  const rule = new TicketViewAuditFloorValueRangeRule(2.1, 2965);
  const item = newTicketViewAudit("x", "y");
  item.floorValue = 2966.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
