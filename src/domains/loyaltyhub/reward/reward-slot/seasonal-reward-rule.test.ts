import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalRewardRule } from "./seasonal-reward-rule.js";

test("SeasonalRewardRule starts in idle", () => {
  const item = newSeasonalRewardRule("code-4", "title-715");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalRewardRule moves to warming", () => {
  const item = newSeasonalRewardRule("code-4", "title-715");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("SeasonalRewardRule rejects moves from stopped", () => {
  const item = newSeasonalRewardRule("code-4", "title-715");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
