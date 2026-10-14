import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryTicketViewCheckpoint } from "./primary-ticket-view-checkpoint.js";

test("PrimaryTicketViewCheckpoint starts in proposed", () => {
  const item = newPrimaryTicketViewCheckpoint("code-277", "title-618");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryTicketViewCheckpoint moves to withdrawn", () => {
  const item = newPrimaryTicketViewCheckpoint("code-277", "title-618");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("PrimaryTicketViewCheckpoint rejects moves from withdrawn", () => {
  const item = newPrimaryTicketViewCheckpoint("code-277", "title-618");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
