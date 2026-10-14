import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveSubscriptionCheckpoint } from "./adaptive-subscription-checkpoint.js";

test("AdaptiveSubscriptionCheckpoint starts in idle", () => {
  const item = newAdaptiveSubscriptionCheckpoint("code-370", "title-600");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveSubscriptionCheckpoint moves to warming", () => {
  const item = newAdaptiveSubscriptionCheckpoint("code-370", "title-600");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("AdaptiveSubscriptionCheckpoint rejects moves from stopped", () => {
  const item = newAdaptiveSubscriptionCheckpoint("code-370", "title-600");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
