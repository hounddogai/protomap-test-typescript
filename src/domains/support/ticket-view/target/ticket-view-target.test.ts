import assert from "node:assert/strict";
import { test } from "node:test";
import { newTicketViewTarget } from "./ticket-view-target.js";

test("TicketViewTarget starts in new", () => {
  const item = newTicketViewTarget("code-469", "label-957");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TicketViewTarget moves to running", () => {
  const item = newTicketViewTarget("code-469", "label-957");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("TicketViewTarget rejects moves from failed", () => {
  const item = newTicketViewTarget("code-469", "label-957");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
