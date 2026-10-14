import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveTicketViewAssignment } from "./adaptive-ticket-view-assignment.js";

test("AdaptiveTicketViewAssignment starts in idle", () => {
  const item = newAdaptiveTicketViewAssignment("code-472", "name-883");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveTicketViewAssignment moves to warming", () => {
  const item = newAdaptiveTicketViewAssignment("code-472", "name-883");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("AdaptiveTicketViewAssignment rejects moves from stopped", () => {
  const item = newAdaptiveTicketViewAssignment("code-472", "name-883");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
