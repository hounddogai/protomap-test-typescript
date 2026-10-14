import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedTicketViewAgreement } from "./weighted-ticket-view-agreement.js";

test("WeightedTicketViewAgreement starts in idle", () => {
  const item = newWeightedTicketViewAgreement("code-237", "title-363");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedTicketViewAgreement moves to warming", () => {
  const item = newWeightedTicketViewAgreement("code-237", "title-363");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("WeightedTicketViewAgreement rejects moves from stopped", () => {
  const item = newWeightedTicketViewAgreement("code-237", "title-363");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
