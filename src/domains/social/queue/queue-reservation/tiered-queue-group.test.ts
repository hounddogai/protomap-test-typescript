import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredQueueGroup } from "./tiered-queue-group.js";

test("TieredQueueGroup starts in idle", () => {
  const item = newTieredQueueGroup("code-695", "label-39");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredQueueGroup moves to draining", () => {
  const item = newTieredQueueGroup("code-695", "label-39");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("TieredQueueGroup rejects moves from stopped", () => {
  const item = newTieredQueueGroup("code-695", "label-39");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
