import assert from "node:assert/strict";
import { test } from "node:test";
import { newFunnelCheckpoint } from "./funnel-checkpoint.js";

test("FunnelCheckpoint starts in planned", () => {
  const item = newFunnelCheckpoint("code-367", "label-64");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FunnelCheckpoint moves to in progress", () => {
  const item = newFunnelCheckpoint("code-367", "label-64");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("FunnelCheckpoint rejects moves from cancelled", () => {
  const item = newFunnelCheckpoint("code-367", "label-64");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
