import assert from "node:assert/strict";
import { test } from "node:test";
import { newPathReservation } from "./path-reservation.js";

test("PathReservation starts in requested", () => {
  const item = newPathReservation("code-559", "label-251");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PathReservation moves to granted", () => {
  const item = newPathReservation("code-559", "label-251");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("PathReservation rejects moves from expired", () => {
  const item = newPathReservation("code-559", "label-251");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
