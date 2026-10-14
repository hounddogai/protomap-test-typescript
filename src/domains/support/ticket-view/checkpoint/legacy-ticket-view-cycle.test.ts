import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyTicketViewCycle } from "./legacy-ticket-view-cycle.js";

test("LegacyTicketViewCycle starts in proposed", () => {
  const item = newLegacyTicketViewCycle("code-95", "name-345");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyTicketViewCycle moves to approved", () => {
  const item = newLegacyTicketViewCycle("code-95", "name-345");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("LegacyTicketViewCycle rejects moves from withdrawn", () => {
  const item = newLegacyTicketViewCycle("code-95", "name-345");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
