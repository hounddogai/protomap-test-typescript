import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictJourneyRollup } from "./strict-journey-rollup.js";

test("StrictJourneyRollup starts in requested", () => {
  const item = newStrictJourneyRollup("code-841", "label-304");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictJourneyRollup moves to granted", () => {
  const item = newStrictJourneyRollup("code-841", "label-304");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("StrictJourneyRollup rejects moves from expired", () => {
  const item = newStrictJourneyRollup("code-841", "label-304");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
