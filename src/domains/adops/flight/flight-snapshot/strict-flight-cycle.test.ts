import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictFlightCycle } from "./strict-flight-cycle.js";

test("StrictFlightCycle starts in requested", () => {
  const item = newStrictFlightCycle("code-37", "label-749");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictFlightCycle moves to revoked", () => {
  const item = newStrictFlightCycle("code-37", "label-749");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("StrictFlightCycle rejects moves from expired", () => {
  const item = newStrictFlightCycle("code-37", "label-749");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
