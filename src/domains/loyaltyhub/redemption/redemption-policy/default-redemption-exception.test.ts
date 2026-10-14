import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultRedemptionException } from "./default-redemption-exception.js";

test("DefaultRedemptionException starts in idle", () => {
  const item = newDefaultRedemptionException("code-376", "label-188");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultRedemptionException moves to stopped", () => {
  const item = newDefaultRedemptionException("code-376", "label-188");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("DefaultRedemptionException rejects moves from stopped", () => {
  const item = newDefaultRedemptionException("code-376", "label-188");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
