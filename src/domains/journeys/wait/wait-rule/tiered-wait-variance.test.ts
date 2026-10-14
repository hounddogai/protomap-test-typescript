import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredWaitVariance } from "./tiered-wait-variance.js";

test("TieredWaitVariance starts in idle", () => {
  const item = newTieredWaitVariance("code-202", "name-834");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredWaitVariance moves to stopped", () => {
  const item = newTieredWaitVariance("code-202", "name-834");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("TieredWaitVariance rejects moves from stopped", () => {
  const item = newTieredWaitVariance("code-202", "name-834");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
