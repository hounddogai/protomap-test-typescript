import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalRewardThreshold } from "./seasonal-reward-threshold.js";

test("SeasonalRewardThreshold starts in draft", () => {
  const item = newSeasonalRewardThreshold("code-702", "name-484");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalRewardThreshold moves to pending", () => {
  const item = newSeasonalRewardThreshold("code-702", "name-484");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("SeasonalRewardThreshold rejects moves from closed", () => {
  const item = newSeasonalRewardThreshold("code-702", "name-484");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
