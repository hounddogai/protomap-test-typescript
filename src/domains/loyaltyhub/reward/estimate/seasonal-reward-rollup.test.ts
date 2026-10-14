import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalRewardRollup } from "./seasonal-reward-rollup.js";

test("SeasonalRewardRollup starts in idle", () => {
  const item = newSeasonalRewardRollup("code-775", "label-669");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalRewardRollup moves to draining", () => {
  const item = newSeasonalRewardRollup("code-775", "label-669");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("SeasonalRewardRollup rejects moves from stopped", () => {
  const item = newSeasonalRewardRollup("code-775", "label-669");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
