import assert from "node:assert/strict";
import { test } from "node:test";
import { newTicketViewBatch } from "./ticket-view-batch.js";

test("TicketViewBatch starts in draft", () => {
  const item = newTicketViewBatch("code-16", "title-314");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TicketViewBatch moves to active", () => {
  const item = newTicketViewBatch("code-16", "title-314");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("TicketViewBatch rejects moves from closed", () => {
  const item = newTicketViewBatch("code-16", "title-314");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
