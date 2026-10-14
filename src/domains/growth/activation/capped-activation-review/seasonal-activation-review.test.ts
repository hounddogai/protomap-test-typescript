import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalActivationReview } from "./seasonal-activation-review.js";

test("SeasonalActivationReview starts in idle", () => {
  const item = newSeasonalActivationReview("code-696", "name-473");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalActivationReview moves to ready", () => {
  const item = newSeasonalActivationReview("code-696", "name-473");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("SeasonalActivationReview rejects moves from stopped", () => {
  const item = newSeasonalActivationReview("code-696", "name-473");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
