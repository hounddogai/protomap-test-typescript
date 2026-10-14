import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedTierRecord } from "./weighted-tier-record.js";

test("WeightedTierRecord starts in idle", () => {
  const item = newWeightedTierRecord("code-557", "name-184");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedTierRecord moves to ready", () => {
  const item = newWeightedTierRecord("code-557", "name-184");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("WeightedTierRecord rejects moves from stopped", () => {
  const item = newWeightedTierRecord("code-557", "name-184");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
