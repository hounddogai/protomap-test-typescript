import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledTicketViewScore } from "./scheduled-ticket-view-score.js";

test("ScheduledTicketViewScore starts in planned", () => {
  const item = newScheduledTicketViewScore("code-282", "name-401");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledTicketViewScore moves to scheduled", () => {
  const item = newScheduledTicketViewScore("code-282", "name-401");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("ScheduledTicketViewScore rejects moves from cancelled", () => {
  const item = newScheduledTicketViewScore("code-282", "name-401");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
