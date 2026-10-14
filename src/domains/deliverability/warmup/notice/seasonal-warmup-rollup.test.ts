import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalWarmupRollup } from "./seasonal-warmup-rollup.js";

test("SeasonalWarmupRollup starts in created", () => {
  const item = newSeasonalWarmupRollup("code-407", "name-115");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalWarmupRollup moves to retired", () => {
  const item = newSeasonalWarmupRollup("code-407", "name-115");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("SeasonalWarmupRollup rejects moves from retired", () => {
  const item = newSeasonalWarmupRollup("code-407", "name-115");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
