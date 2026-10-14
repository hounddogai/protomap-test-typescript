import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyFlightClaim } from "./legacy-flight-claim.js";

test("LegacyFlightClaim starts in created", () => {
  const item = newLegacyFlightClaim("code-474", "title-399");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyFlightClaim moves to validated", () => {
  const item = newLegacyFlightClaim("code-474", "title-399");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("LegacyFlightClaim rejects moves from retired", () => {
  const item = newLegacyFlightClaim("code-474", "title-399");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
