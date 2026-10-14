import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalFlightClaim } from "./global-flight-claim.js";

test("GlobalFlightClaim starts in idle", () => {
  const item = newGlobalFlightClaim("code-534", "name-588");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalFlightClaim moves to warming", () => {
  const item = newGlobalFlightClaim("code-534", "name-588");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("GlobalFlightClaim rejects moves from stopped", () => {
  const item = newGlobalFlightClaim("code-534", "name-588");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
