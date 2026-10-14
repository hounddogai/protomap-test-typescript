import assert from "node:assert/strict";
import { test } from "node:test";
import { newTicketViewSlot } from "./ticket-view-slot.js";

test("TicketViewSlot starts in open", () => {
  const item = newTicketViewSlot("code-319", "title-75");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TicketViewSlot moves to in review", () => {
  const item = newTicketViewSlot("code-319", "title-75");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("TicketViewSlot rejects moves from archived", () => {
  const item = newTicketViewSlot("code-319", "title-75");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
