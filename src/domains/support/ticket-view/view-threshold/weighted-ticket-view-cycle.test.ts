import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedTicketViewCycle } from "./weighted-ticket-view-cycle.js";

test("WeightedTicketViewCycle starts in draft", () => {
  const item = newWeightedTicketViewCycle("code-819", "label-198");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedTicketViewCycle moves to pending", () => {
  const item = newWeightedTicketViewCycle("code-819", "label-198");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("WeightedTicketViewCycle rejects moves from closed", () => {
  const item = newWeightedTicketViewCycle("code-819", "label-198");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
