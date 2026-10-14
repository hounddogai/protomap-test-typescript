import assert from "node:assert/strict";
import { test } from "node:test";
import { newTicketViewAdjustment } from "./ticket-view-adjustment.js";

test("TicketViewAdjustment starts in draft", () => {
  const item = newTicketViewAdjustment("code-256", "name-826");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TicketViewAdjustment moves to pending", () => {
  const item = newTicketViewAdjustment("code-256", "name-826");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("TicketViewAdjustment rejects moves from closed", () => {
  const item = newTicketViewAdjustment("code-256", "name-826");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
