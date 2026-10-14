import assert from "node:assert/strict";
import { test } from "node:test";
import { newTicketViewThreshold } from "./ticket-view-threshold.js";

test("TicketViewThreshold starts in planned", () => {
  const item = newTicketViewThreshold("code-205", "label-811");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TicketViewThreshold moves to scheduled", () => {
  const item = newTicketViewThreshold("code-205", "label-811");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("TicketViewThreshold rejects moves from cancelled", () => {
  const item = newTicketViewThreshold("code-205", "label-811");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
