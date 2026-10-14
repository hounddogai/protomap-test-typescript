import assert from "node:assert/strict";
import { test } from "node:test";
import { newFlightQuota } from "./flight-quota.js";

test("FlightQuota starts in requested", () => {
  const item = newFlightQuota("code-666", "name-342");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FlightQuota moves to granted", () => {
  const item = newFlightQuota("code-666", "name-342");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("FlightQuota rejects moves from expired", () => {
  const item = newFlightQuota("code-666", "name-342");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
