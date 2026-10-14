import assert from "node:assert/strict";
import { test } from "node:test";
import { newDomainReservation } from "./domain-reservation.js";

test("DomainReservation starts in created", () => {
  const item = newDomainReservation("code-787", "name-184");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DomainReservation moves to validated", () => {
  const item = newDomainReservation("code-787", "name-184");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("DomainReservation rejects moves from retired", () => {
  const item = newDomainReservation("code-787", "name-184");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
