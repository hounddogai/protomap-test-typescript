import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientJourneyPolicy } from "./lenient-journey-policy.js";

test("LenientJourneyPolicy starts in requested", () => {
  const item = newLenientJourneyPolicy("code-357", "label-701");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientJourneyPolicy moves to granted", () => {
  const item = newLenientJourneyPolicy("code-357", "label-701");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("LenientJourneyPolicy rejects moves from expired", () => {
  const item = newLenientJourneyPolicy("code-357", "label-701");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
