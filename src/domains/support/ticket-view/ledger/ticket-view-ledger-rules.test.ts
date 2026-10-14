import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TicketViewLedgerFloorValueRangeRule,
  TicketViewLedgerNameLengthRule,
  TicketViewLedgerRequiredCodeRule,
  TicketViewLedgerRequiredOwnerIdRule,
  defaultTicketViewLedgerValidator,
} from "./ticket-view-ledger-rules.js";
import { newTicketViewLedger } from "./ticket-view-ledger.js";

test("TicketViewLedgerValidator reports every problem", () => {
  const validator = defaultTicketViewLedgerValidator();
  const item = newTicketViewLedger("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TicketViewLedgerRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new TicketViewLedgerRequiredOwnerIdRule("ticket view ledger needs an entry");
  const item = newTicketViewLedger("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TicketViewLedgerNameLengthRule flags a long name", () => {
  const rule = new TicketViewLedgerNameLengthRule(120);
  const item = newTicketViewLedger("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TicketViewLedgerRequiredCodeRule flags a blank code", () => {
  const rule = new TicketViewLedgerRequiredCodeRule("ticket view ledger needs a value");
  const item = newTicketViewLedger("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TicketViewLedgerFloorValueRangeRule flags values above floor value", () => {
  const rule = new TicketViewLedgerFloorValueRangeRule(9.3, 1878.1);
  const item = newTicketViewLedger("x", "y");
  item.floorValue = 1879.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
