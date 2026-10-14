import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackTicketViewSlot } from "./fallback-ticket-view-slot.js";

test("FallbackTicketViewSlot starts in requested", () => {
  const item = newFallbackTicketViewSlot("code-510", "name-631");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackTicketViewSlot moves to expired", () => {
  const item = newFallbackTicketViewSlot("code-510", "name-631");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("FallbackTicketViewSlot rejects moves from expired", () => {
  const item = newFallbackTicketViewSlot("code-510", "name-631");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
