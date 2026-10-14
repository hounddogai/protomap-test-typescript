import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictTicketViewSlot } from "./strict-ticket-view-slot.js";

test("StrictTicketViewSlot starts in requested", () => {
  const item = newStrictTicketViewSlot("code-519", "name-836");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictTicketViewSlot moves to revoked", () => {
  const item = newStrictTicketViewSlot("code-519", "name-836");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("StrictTicketViewSlot rejects moves from expired", () => {
  const item = newStrictTicketViewSlot("code-519", "name-836");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
