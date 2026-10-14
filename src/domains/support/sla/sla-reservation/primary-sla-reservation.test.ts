import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimarySlaReservation } from "./primary-sla-reservation.js";

test("PrimarySlaReservation starts in requested", () => {
  const item = newPrimarySlaReservation("code-549", "name-380");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimarySlaReservation moves to granted", () => {
  const item = newPrimarySlaReservation("code-549", "name-380");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("PrimarySlaReservation rejects moves from expired", () => {
  const item = newPrimarySlaReservation("code-549", "name-380");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
