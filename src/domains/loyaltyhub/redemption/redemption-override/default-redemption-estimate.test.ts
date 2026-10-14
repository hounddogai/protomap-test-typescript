import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultRedemptionEstimate } from "./default-redemption-estimate.js";

test("DefaultRedemptionEstimate starts in idle", () => {
  const item = newDefaultRedemptionEstimate("code-748", "title-401");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultRedemptionEstimate moves to ready", () => {
  const item = newDefaultRedemptionEstimate("code-748", "title-401");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("DefaultRedemptionEstimate rejects moves from stopped", () => {
  const item = newDefaultRedemptionEstimate("code-748", "title-401");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
