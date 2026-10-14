import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyTicketViewSummary } from "./legacy-ticket-view-summary.js";

test("LegacyTicketViewSummary starts in idle", () => {
  const item = newLegacyTicketViewSummary("code-178", "title-234");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyTicketViewSummary moves to warming", () => {
  const item = newLegacyTicketViewSummary("code-178", "title-234");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("LegacyTicketViewSummary rejects moves from stopped", () => {
  const item = newLegacyTicketViewSummary("code-178", "title-234");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
