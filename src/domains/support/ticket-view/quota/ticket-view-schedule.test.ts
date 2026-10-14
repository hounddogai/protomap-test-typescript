import assert from "node:assert/strict";
import { test } from "node:test";
import { newTicketViewSchedule } from "./ticket-view-schedule.js";

test("TicketViewSchedule starts in open", () => {
  const item = newTicketViewSchedule("code-759", "label-434");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TicketViewSchedule moves to resolved", () => {
  const item = newTicketViewSchedule("code-759", "label-434");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("TicketViewSchedule rejects moves from archived", () => {
  const item = newTicketViewSchedule("code-759", "label-434");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
