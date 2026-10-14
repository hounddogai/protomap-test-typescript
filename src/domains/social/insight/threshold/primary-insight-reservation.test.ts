import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryInsightReservation } from "./primary-insight-reservation.js";

test("PrimaryInsightReservation starts in new", () => {
  const item = newPrimaryInsightReservation("code-87", "name-108");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryInsightReservation moves to done", () => {
  const item = newPrimaryInsightReservation("code-87", "name-108");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("PrimaryInsightReservation rejects moves from failed", () => {
  const item = newPrimaryInsightReservation("code-87", "name-108");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
