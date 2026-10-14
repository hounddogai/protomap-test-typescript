import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualTicketViewSchedule } from "./manual-ticket-view-schedule.js";

test("ManualTicketViewSchedule starts in open", () => {
  const item = newManualTicketViewSchedule("code-774", "title-319");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualTicketViewSchedule moves to resolved", () => {
  const item = newManualTicketViewSchedule("code-774", "title-319");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("ManualTicketViewSchedule rejects moves from archived", () => {
  const item = newManualTicketViewSchedule("code-774", "title-319");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
