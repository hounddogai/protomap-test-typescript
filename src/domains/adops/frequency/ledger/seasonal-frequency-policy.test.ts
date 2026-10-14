import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalFrequencyPolicy } from "./seasonal-frequency-policy.js";

test("SeasonalFrequencyPolicy starts in requested", () => {
  const item = newSeasonalFrequencyPolicy("code-142", "label-51");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalFrequencyPolicy moves to granted", () => {
  const item = newSeasonalFrequencyPolicy("code-142", "label-51");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("SeasonalFrequencyPolicy rejects moves from expired", () => {
  const item = newSeasonalFrequencyPolicy("code-142", "label-51");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
