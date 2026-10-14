import assert from "node:assert/strict";
import { test } from "node:test";
import { newTicketViewEstimate } from "./ticket-view-estimate.js";

test("TicketViewEstimate starts in new", () => {
  const item = newTicketViewEstimate("code-104", "name-731");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TicketViewEstimate moves to done", () => {
  const item = newTicketViewEstimate("code-104", "name-731");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("TicketViewEstimate rejects moves from failed", () => {
  const item = newTicketViewEstimate("code-104", "name-731");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
