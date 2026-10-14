import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedTicketViewDigest } from "./weighted-ticket-view-digest.js";

test("WeightedTicketViewDigest starts in planned", () => {
  const item = newWeightedTicketViewDigest("code-43", "name-986");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedTicketViewDigest moves to scheduled", () => {
  const item = newWeightedTicketViewDigest("code-43", "name-986");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("WeightedTicketViewDigest rejects moves from cancelled", () => {
  const item = newWeightedTicketViewDigest("code-43", "name-986");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
