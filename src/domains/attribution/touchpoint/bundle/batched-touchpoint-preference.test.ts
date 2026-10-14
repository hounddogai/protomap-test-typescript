import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedTouchpointPreference } from "./batched-touchpoint-preference.js";

test("BatchedTouchpointPreference starts in idle", () => {
  const item = newBatchedTouchpointPreference("code-578", "label-452");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedTouchpointPreference moves to ready", () => {
  const item = newBatchedTouchpointPreference("code-578", "label-452");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("BatchedTouchpointPreference rejects moves from stopped", () => {
  const item = newBatchedTouchpointPreference("code-578", "label-452");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
