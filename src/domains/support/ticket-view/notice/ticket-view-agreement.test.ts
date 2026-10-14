import assert from "node:assert/strict";
import { test } from "node:test";
import { newTicketViewAgreement } from "./ticket-view-agreement.js";

test("TicketViewAgreement starts in new", () => {
  const item = newTicketViewAgreement("code-734", "name-740");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TicketViewAgreement moves to running", () => {
  const item = newTicketViewAgreement("code-734", "name-740");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("TicketViewAgreement rejects moves from failed", () => {
  const item = newTicketViewAgreement("code-734", "name-740");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
