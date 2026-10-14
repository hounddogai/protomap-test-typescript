import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalFlightClaim } from "./seasonal-flight-claim.js";

test("SeasonalFlightClaim starts in idle", () => {
  const item = newSeasonalFlightClaim("code-72", "title-192");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalFlightClaim moves to warming", () => {
  const item = newSeasonalFlightClaim("code-72", "title-192");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("SeasonalFlightClaim rejects moves from stopped", () => {
  const item = newSeasonalFlightClaim("code-72", "title-192");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
