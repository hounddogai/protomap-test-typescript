import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictDomainReservation } from "./strict-domain-reservation.js";

test("StrictDomainReservation starts in requested", () => {
  const item = newStrictDomainReservation("code-890", "name-204");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictDomainReservation moves to revoked", () => {
  const item = newStrictDomainReservation("code-890", "name-204");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("StrictDomainReservation rejects moves from expired", () => {
  const item = newStrictDomainReservation("code-890", "name-204");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
