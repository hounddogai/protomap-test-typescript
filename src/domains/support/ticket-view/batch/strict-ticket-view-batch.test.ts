import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictTicketViewBatch } from "./strict-ticket-view-batch.js";

test("StrictTicketViewBatch starts in new", () => {
  const item = newStrictTicketViewBatch("code-360", "name-617");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictTicketViewBatch moves to running", () => {
  const item = newStrictTicketViewBatch("code-360", "name-617");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("StrictTicketViewBatch rejects moves from failed", () => {
  const item = newStrictTicketViewBatch("code-360", "name-617");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
