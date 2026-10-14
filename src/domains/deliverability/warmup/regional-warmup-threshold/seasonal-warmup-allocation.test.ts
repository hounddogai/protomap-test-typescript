import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalWarmupAllocation } from "./seasonal-warmup-allocation.js";

test("SeasonalWarmupAllocation starts in requested", () => {
  const item = newSeasonalWarmupAllocation("code-707", "name-212");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalWarmupAllocation moves to granted", () => {
  const item = newSeasonalWarmupAllocation("code-707", "name-212");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("SeasonalWarmupAllocation rejects moves from expired", () => {
  const item = newSeasonalWarmupAllocation("code-707", "name-212");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
