import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualTicketViewAssignment } from "./manual-ticket-view-assignment.js";

test("ManualTicketViewAssignment starts in requested", () => {
  const item = newManualTicketViewAssignment("code-876", "title-252");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualTicketViewAssignment moves to expired", () => {
  const item = newManualTicketViewAssignment("code-876", "title-252");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("ManualTicketViewAssignment rejects moves from expired", () => {
  const item = newManualTicketViewAssignment("code-876", "title-252");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
