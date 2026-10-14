import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalInsightReservation } from "./regional-insight-reservation.js";

test("RegionalInsightReservation starts in created", () => {
  const item = newRegionalInsightReservation("code-382", "name-103");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalInsightReservation moves to published", () => {
  const item = newRegionalInsightReservation("code-382", "name-103");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("RegionalInsightReservation rejects moves from retired", () => {
  const item = newRegionalInsightReservation("code-382", "name-103");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
