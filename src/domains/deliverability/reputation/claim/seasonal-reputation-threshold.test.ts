import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalReputationThreshold } from "./seasonal-reputation-threshold.js";

test("SeasonalReputationThreshold starts in proposed", () => {
  const item = newSeasonalReputationThreshold("code-46", "label-850");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalReputationThreshold moves to approved", () => {
  const item = newSeasonalReputationThreshold("code-46", "label-850");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("SeasonalReputationThreshold rejects moves from withdrawn", () => {
  const item = newSeasonalReputationThreshold("code-46", "label-850");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
