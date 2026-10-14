import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryTicketViewSchedule } from "./primary-ticket-view-schedule.js";

test("PrimaryTicketViewSchedule starts in requested", () => {
  const item = newPrimaryTicketViewSchedule("code-730", "label-769");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryTicketViewSchedule moves to granted", () => {
  const item = newPrimaryTicketViewSchedule("code-730", "label-769");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("PrimaryTicketViewSchedule rejects moves from expired", () => {
  const item = newPrimaryTicketViewSchedule("code-730", "label-769");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
