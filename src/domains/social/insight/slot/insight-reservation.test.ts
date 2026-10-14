import assert from "node:assert/strict";
import { test } from "node:test";
import { newInsightReservation } from "./insight-reservation.js";

test("InsightReservation starts in proposed", () => {
  const item = newInsightReservation("code-527", "title-866");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InsightReservation moves to approved", () => {
  const item = newInsightReservation("code-527", "title-866");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("InsightReservation rejects moves from withdrawn", () => {
  const item = newInsightReservation("code-527", "title-866");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
