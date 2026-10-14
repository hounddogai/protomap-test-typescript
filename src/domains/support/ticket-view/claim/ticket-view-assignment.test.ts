import assert from "node:assert/strict";
import { test } from "node:test";
import { newTicketViewAssignment } from "./ticket-view-assignment.js";

test("TicketViewAssignment starts in new", () => {
  const item = newTicketViewAssignment("code-989", "name-298");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TicketViewAssignment moves to running", () => {
  const item = newTicketViewAssignment("code-989", "name-298");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("TicketViewAssignment rejects moves from failed", () => {
  const item = newTicketViewAssignment("code-989", "name-298");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
