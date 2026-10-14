import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyTicketViewAssignment } from "./legacy-ticket-view-assignment.js";

test("LegacyTicketViewAssignment starts in open", () => {
  const item = newLegacyTicketViewAssignment("code-626", "name-280");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyTicketViewAssignment moves to in review", () => {
  const item = newLegacyTicketViewAssignment("code-626", "name-280");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("LegacyTicketViewAssignment rejects moves from archived", () => {
  const item = newLegacyTicketViewAssignment("code-626", "name-280");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
