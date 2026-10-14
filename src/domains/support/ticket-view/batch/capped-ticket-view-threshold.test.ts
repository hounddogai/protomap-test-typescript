import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedTicketViewThreshold } from "./capped-ticket-view-threshold.js";

test("CappedTicketViewThreshold starts in requested", () => {
  const item = newCappedTicketViewThreshold("code-714", "label-510");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedTicketViewThreshold moves to granted", () => {
  const item = newCappedTicketViewThreshold("code-714", "label-510");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("CappedTicketViewThreshold rejects moves from expired", () => {
  const item = newCappedTicketViewThreshold("code-714", "label-510");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
