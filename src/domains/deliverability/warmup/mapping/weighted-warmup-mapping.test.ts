import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedWarmupMapping } from "./weighted-warmup-mapping.js";

test("WeightedWarmupMapping starts in proposed", () => {
  const item = newWeightedWarmupMapping("code-894", "name-609");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedWarmupMapping moves to rejected", () => {
  const item = newWeightedWarmupMapping("code-894", "name-609");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("WeightedWarmupMapping rejects moves from withdrawn", () => {
  const item = newWeightedWarmupMapping("code-894", "name-609");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
