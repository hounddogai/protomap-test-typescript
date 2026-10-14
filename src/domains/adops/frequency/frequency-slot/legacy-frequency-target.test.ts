import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyFrequencyTarget } from "./legacy-frequency-target.js";

test("LegacyFrequencyTarget starts in proposed", () => {
  const item = newLegacyFrequencyTarget("code-12", "name-813");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyFrequencyTarget moves to approved", () => {
  const item = newLegacyFrequencyTarget("code-12", "name-813");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("LegacyFrequencyTarget rejects moves from withdrawn", () => {
  const item = newLegacyFrequencyTarget("code-12", "name-813");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
