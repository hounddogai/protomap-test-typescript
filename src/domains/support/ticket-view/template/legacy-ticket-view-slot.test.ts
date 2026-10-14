import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyTicketViewSlot } from "./legacy-ticket-view-slot.js";

test("LegacyTicketViewSlot starts in created", () => {
  const item = newLegacyTicketViewSlot("code-945", "name-133");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyTicketViewSlot moves to validated", () => {
  const item = newLegacyTicketViewSlot("code-945", "name-133");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("LegacyTicketViewSlot rejects moves from retired", () => {
  const item = newLegacyTicketViewSlot("code-945", "name-133");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
