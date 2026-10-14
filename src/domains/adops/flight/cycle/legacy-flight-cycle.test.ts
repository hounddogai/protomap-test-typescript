import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyFlightCycle } from "./legacy-flight-cycle.js";

test("LegacyFlightCycle starts in proposed", () => {
  const item = newLegacyFlightCycle("code-827", "title-628");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyFlightCycle moves to approved", () => {
  const item = newLegacyFlightCycle("code-827", "title-628");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("LegacyFlightCycle rejects moves from withdrawn", () => {
  const item = newLegacyFlightCycle("code-827", "title-628");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
