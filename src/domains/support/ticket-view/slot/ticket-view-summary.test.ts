import assert from "node:assert/strict";
import { test } from "node:test";
import { newTicketViewSummary } from "./ticket-view-summary.js";

test("TicketViewSummary starts in proposed", () => {
  const item = newTicketViewSummary("code-33", "title-499");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TicketViewSummary moves to rejected", () => {
  const item = newTicketViewSummary("code-33", "title-499");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("TicketViewSummary rejects moves from withdrawn", () => {
  const item = newTicketViewSummary("code-33", "title-499");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
