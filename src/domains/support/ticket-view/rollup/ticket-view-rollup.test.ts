import assert from "node:assert/strict";
import { test } from "node:test";
import { newTicketViewRollup } from "./ticket-view-rollup.js";

test("TicketViewRollup starts in planned", () => {
  const item = newTicketViewRollup("code-869", "label-835");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TicketViewRollup moves to in progress", () => {
  const item = newTicketViewRollup("code-869", "label-835");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("TicketViewRollup rejects moves from cancelled", () => {
  const item = newTicketViewRollup("code-869", "label-835");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
