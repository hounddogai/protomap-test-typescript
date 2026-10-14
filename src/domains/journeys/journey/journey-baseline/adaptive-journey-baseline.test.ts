import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveJourneyBaseline } from "./adaptive-journey-baseline.js";

test("AdaptiveJourneyBaseline starts in requested", () => {
  const item = newAdaptiveJourneyBaseline("code-420", "label-5");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveJourneyBaseline moves to expired", () => {
  const item = newAdaptiveJourneyBaseline("code-420", "label-5");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("AdaptiveJourneyBaseline rejects moves from expired", () => {
  const item = newAdaptiveJourneyBaseline("code-420", "label-5");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
